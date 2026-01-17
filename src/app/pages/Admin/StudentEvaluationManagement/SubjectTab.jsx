import React, { useEffect, useState } from "react";
import { createEvaluation, updateEvaluation } from "../../../lib/studentEvaluationService";
import { fetchGet } from "../../../lib/httpHandler";
import { toast } from "react-toastify";
import { Snackbar, Alert } from "@mui/material";
import { getByClass as getFinalRecordsByClass, getByStudent as getFinalRecordsByStudent, createRecord as createFinalRecord, updateRecord as updateFinalRecord } from "../../../lib/finalTermRecordService";

const defaultSemester = "Học kỳ 1";
const defaultYear = "2025-2026";

const SubjectTab = ({ classId: propClassId, subjectId: propSubjectId, schoolYear: propSchoolYear, hideTopControls = false, onRegisterActions }) => {
	const [grade, setGrade] = useState("");
	const [classId, setClassId] = useState("");
	const [subject, setSubject] = useState("");
	const [classOptions, setClassOptions] = useState([]);
	const [classSubjectsMap, setClassSubjectsMap] = useState({});
	const [subjectsForClass, setSubjectsForClass] = useState([]);
	const [semester, setSemester] = useState(defaultSemester);
	const [schoolYear, setSchoolYear] = useState(defaultYear);
	const [students, setStudents] = useState([]);
	const [localSaveSuccess, setLocalSaveSuccess] = useState(false);
	const [localSaveError, setLocalSaveError] = useState(false);

	useEffect(() => {
		// sync props if provided
		if (propClassId) setClassId(propClassId);
		if (propSubjectId) setSubject(propSubjectId);
		if (propSchoolYear) setSchoolYear(propSchoolYear);

		if (classId) {
				fetchGet(`/api/student-profiles/by-class/${classId}`,
					async (data) => {
						const arr = Array.isArray(data) ? data : [];
						const mapped = arr.map((it) => ({
							studentId: it.userId,
							studentName: it.userName,
							email: it.email,
							schoolId: it.schoolId,
							schoolName: it.schoolName,
							classId: it.classId,
							className: it.className,
							enrollDate: it.enrollDate,
							finalEvaluation: it.finalEvaluation || '',
							finalScore: it.finalScore || 0,
							comment: it.comment || '',
							// legacy fields kept for compatibility
							ck1: it.ck1 || '',
							xlck1: it.xlck1 || '',
							finalRecordId: null,
						}));

						// load existing final-term records for this class and merge
						try {
							const records = await new Promise((resolve, reject) => {
								getFinalRecordsByClass(classId, resolve, reject, () => reject(new Error("Network error")));
							});
							const recArr = Array.isArray(records) ? records : [];
							const byStudent = {};
							recArr.forEach(r => { byStudent[r.studentProfileId] = r; });
							for (const s of mapped) {
								const r = byStudent[s.studentId];
								if (r) {
									s.finalScore = r.finalScore;
									s.finalEvaluation = r.finalEvaluation;
									s.comment = r.comment;
									s.finalRecordId = r.id;
								}
							}
						} catch (e) {
							console.warn('Không tải được final-term-records cho lớp:', e);
						}

						setStudents(mapped);
					},
					(err) => console.error(err)
				);
			}
	}, [classId, semester, schoolYear, propClassId, propSubjectId, propSchoolYear]);

	useEffect(() => {
		const accountId = localStorage.getItem("accountId");
		const teacherId = localStorage.getItem("teacherId") || accountId;

		const fetchClassesAndMappings = async () => {
			// Fetch classes by school (like ClassManagement)
			try {
				if (accountId) {
					const user = await new Promise((resolve, reject) => {
						fetchGet(`/api/accounts/by-account/${accountId}`, resolve, reject, () => reject("exception"));
					});
					const schoolId = user?.schoolId;
					if (schoolId) {
						const classes = await new Promise((resolve, reject) => {
							fetchGet(`/api/classes/by-school/${schoolId}`, resolve, reject, () => reject("exception"));
						});
						const clsArr = Array.isArray(classes) ? classes : [];
						setClassOptions(clsArr.map((cls) => ({ classId: cls.id || cls.classId, className: cls.className, grade: cls.grade || cls.gradeId })));
					}
				}
			} catch (err) {
				console.error("Error loading classes by school:", err);
				setClassOptions([]);
			}

			// Fetch class-subjects by teacher to build subjects map
			if (!teacherId) return;
			fetchGet(`/api/class-subjects/by-teacher/${teacherId}`,
				(data) => {
					const arr = Array.isArray(data) ? data : [];
					const map = {};
					arr.forEach((item) => {
						const cid = item.classId || item.classId;
						if (!map[cid]) map[cid] = [];
						map[cid].push({ subjectId: item.subjectId, subjectName: item.subjectName });
					});
					setClassSubjectsMap(map);
				},
				(err) => console.error(err)
			);
		};

		fetchClassesAndMappings();
	}, []);

	useEffect(() => {
		// when a specific class is selected, fetch its subjects
		if (!classId) {
			setSubjectsForClass([]);
			return;
		}
		fetchGet(`/api/class-subjects/by-class/${classId}`,
			(data) => {
				const arr = Array.isArray(data) ? data : [];
				setSubjectsForClass(arr.map((it) => ({ subjectId: it.subjectId, subjectName: it.subjectName })));
			},
			(err) => {
				console.error("Error loading class-subjects by class:", err);
				setSubjectsForClass([]);
			}
		);
	}, [classId]);

	const handleBulkSave = async () => {
		if (!classId || !subject) return toast.error("Vui lòng chọn Khối/Lớp/Môn trước khi lưu.");
		const promises = students.map((s) => {
			// Create or update final-term-record for each student
			const finalPayload = {
				studentProfileId: s.studentId,
				classId: classId,
				subjectId: subject,
				finalScore: Number(s.finalScore) || 0,
				finalEvaluation: s.finalEvaluation || "",
				comment: s.comment || "",
			};
			if (s.finalRecordId) {
				// API expects id in body for PUT
				return updateFinalRecord({ id: s.finalRecordId, subjectId: subject, finalScore: finalPayload.finalScore, finalEvaluation: finalPayload.finalEvaluation, comment: finalPayload.comment }, () => {}, (err) => console.error(err), () => {});
			}
			return createFinalRecord(finalPayload, () => {}, (err) => console.error(err), () => {});
		});
		try {
			await Promise.all(promises);
			//toast.success("Lưu nhập điểm thành công");
			// show local snackbar immediately
			setLocalSaveSuccess(true);
			// allow local snackbar to render before reloading list
			setTimeout(() => handleFetchStudents(), 300);
		} catch (e) {
			console.error(e);
			toast.error("Lỗi khi lưu. Kiểm tra console.");
			setLocalSaveError(true);
		}
	};

	const handleFetchStudents = () => {
		if (!classId) return toast.error("Vui lòng chọn Lớp trước khi tìm.");
		fetchGet(`/api/student-profiles/by-class/${classId}`,
			(async (data) => {
				const arr = Array.isArray(data) ? data : [];
				const mapped = arr.map((it) => ({
					studentId: it.userId,
					studentName: it.userName,
					email: it.email,
					schoolId: it.schoolId,
					schoolName: it.schoolName,
					classId: it.classId,
					className: it.className,
					enrollDate: it.enrollDate,
					finalEvaluation: it.finalEvaluation || '',
					ck1: it.ck1 || '',
					xlck1: it.xlck1 || '',
					finalScore: it.finalScore || 0,
					comment: it.comment || '',
					finalRecordId: null,
				}));

				// Try to load existing final-term records for the class and map to students
				try {
					const records = await new Promise((resolve, reject) => {
						getFinalRecordsByClass(classId, resolve, reject, () => reject(new Error("Network error")));
					});
					const recArr = Array.isArray(records) ? records : [];
					const byStudent = {};
					recArr.forEach(r => {
						byStudent[r.studentProfileId] = r;
					});
					// attach records to mapped students
					for (const s of mapped) {
						const r = byStudent[s.studentId];
						if (r) {
							s.finalScore = r.finalScore;
							s.finalEvaluation = r.finalEvaluation;
							s.comment = r.comment;
							s.finalRecordId = r.id;
						}
					}
				} catch (e) {
					console.warn('Không tải được final-term-records cho lớp:', e);
				}

				setStudents(mapped);
			}),
			(err) => console.error(err)
		);
	};

	// register actions to parent if requested
	useEffect(() => {
		if (typeof onRegisterActions === 'function') {
			onRegisterActions({ fetchStudents: handleFetchStudents, saveAll: handleBulkSave });
		}
	}, [onRegisterActions, classId, subject, semester, schoolYear, students]);

	return (
		<div className="se-panel">
			{!hideTopControls && (
			<div className="se-controls">
				<label>
					Khối
					<select value={grade} onChange={(e) => setGrade(e.target.value)}>
						<option value="">--Chọn Khối--</option>
						<option value="1">Khối 1</option>
						<option value="2">Khối 2</option>
						<option value="3">Khối 3</option>
						<option value="4">Khối 4</option>
						<option value="5">Khối 5</option>
					</select>
				</label>
				<label>
					Lớp
					<select value={classId} onChange={(e) => setClassId(e.target.value)}>
						<option value="">--Chọn Lớp--</option>
						{classOptions.filter(c => !grade || String(c.grade) === String(grade) || (c.className || "").startsWith(String(grade))).map((c) => (
							<option key={c.classId} value={c.classId}>{c.className}</option>
						))}
					</select>
				</label>
				<label>
					Môn
					<select value={subject} onChange={(e) => setSubject(e.target.value)}>
						<option value="">--Chọn Môn--</option>
						{subjectsForClass.map((s) => (
							<option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
						))}
					</select>
				</label>
				<label>
					Học kỳ
					<select value={semester} onChange={(e) => setSemester(e.target.value)}>
						<option>Học kỳ 1</option>
						<option>Học kỳ 2</option>
					</select>
				</label>
				<label>
					Năm học
					<input value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)} />
				</label>
				<div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
					<button className="btn btn-search" onClick={handleFetchStudents}>Tìm</button>
					<button className="btn btn-save" onClick={handleBulkSave}>Lưu</button>
				</div>
			</div>
			)}

			<div className="se-table-wrap">
				<table className="se-table">
					<thead>
						<tr>
							    <th>STT</th>
							    <th>Họ và tên</th>
							    <th>KT CK1</th>
							    <th>XL CK1</th>
							    <th>Nhận xét cuối kì</th>
						</tr>
						</thead>
					<tbody>
						{students.length === 0 ? (
							<tr><td colSpan={5} className="empty">Không có dữ liệu. Nhập mã lớp và chọn kỳ/năm.</td></tr>
						) : (
							students.map((s, idx) => (
								<tr key={s.studentId}>
									<td>{idx + 1}</td>
									<td>{s.studentName}</td>
									<td>
										{/* KT CK1 -> finalScore (narrow column) */}
										<input
											type="number"
											style={{ width: 80 }}
											value={s.finalScore ?? ""}
											onChange={(e) => {
												const v = e.target.value;
												const num = v === "" ? "" : Number(v);
												if (v !== "" && (isNaN(num) || num < 0 || num > 10)) {
													toast.warn("Điểm phải nằm trong khoảng 0 - 10");
													return;
												}
												s.finalScore = num === "" ? 0 : num;
												setStudents([...students]);
											}}
										/>
									</td>
									<td>
										{/* XL CK1 -> finalEvaluation (store via combobox values) */}
										<select value={s.finalEvaluation || ''} onChange={(e) => { s.finalEvaluation = e.target.value; setStudents([...students]); }}>
											<option value="">--Chọn--</option>
											<option value="Xuất sắc">Xuất sắc</option>
											<option value="Tốt">Tốt</option>
											<option value="Khá">Khá</option>
											<option value="Trung bình">Trung bình</option>
										</select>
									</td>
									<td>
										{/* Nhận xét cuối kì -> comment */}
										<input value={s.comment || ''} onChange={(e) => { s.comment = e.target.value; setStudents([...students]); }} />
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

				{/* Local snackbar fallback for immediate feedback */}
				<Snackbar open={localSaveSuccess} autoHideDuration={3000} onClose={() => setLocalSaveSuccess(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
					<Alert onClose={() => setLocalSaveSuccess(false)} severity="success" sx={{ width: '100%' }}>
						Lưu nhập điểm thành công
					</Alert>
				</Snackbar>
				<Snackbar open={localSaveError} autoHideDuration={3000} onClose={() => setLocalSaveError(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
					<Alert onClose={() => setLocalSaveError(false)} severity="error" sx={{ width: '100%' }}>
						Lỗi khi lưu. Kiểm tra console.
					</Alert>
				</Snackbar>
		</div>
	);
};

export default SubjectTab;
