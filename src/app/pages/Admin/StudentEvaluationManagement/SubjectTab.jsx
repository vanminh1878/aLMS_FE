import React, { useEffect, useState } from "react";
import { createEvaluation, updateEvaluation } from "../../../lib/studentEvaluationService";
import { fetchGet } from "../../../lib/httpHandler";

const defaultSemester = "Học kỳ 1";
const defaultYear = "2025-2026";

const SubjectTab = () => {
	const [grade, setGrade] = useState("");
	const [classId, setClassId] = useState("");
	const [subject, setSubject] = useState("");
	const [classOptions, setClassOptions] = useState([]);
	const [classSubjectsMap, setClassSubjectsMap] = useState({});
	const [subjectsForClass, setSubjectsForClass] = useState([]);
	const [semester, setSemester] = useState(defaultSemester);
	const [schoolYear, setSchoolYear] = useState(defaultYear);
	const [students, setStudents] = useState([]);

	useEffect(() => {
			if (classId) {
				fetchGet(`/api/student-profiles/by-class/${classId}`,
					(data) => {
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
						}));
						setStudents(mapped);
					},
					(err) => console.error(err)
				);
			}
	}, [classId, semester, schoolYear]);

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
		if (!classId || !subject) return alert("Vui lòng chọn Khối/Lớp/Môn trước khi lưu.");
		const promises = students.map((s) => {
			const payload = {
				studentId: s.studentId,
				classId: classId,
				semester,
				schoolYear,
				finalScore: Number(s.finalScore) || 0,
				level: s.level || "",
				generalComment: s.finalEvaluationComment || s.generalComment || "",
				finalEvaluation: s.finalEvaluation || "",
			};
			if (s.id) return updateEvaluation(s.id, payload, () => {}, (err) => console.error(err), () => {});
			return createEvaluation(payload, () => {}, (err) => console.error(err), () => {});
		});
		try {
			await Promise.all(promises);
			alert("Lưu tất cả thành công");
		} catch (e) {
			console.error(e);
			alert("Lỗi khi lưu. Kiểm tra console.");
		}
	};

	const handleFetchStudents = () => {
		if (!classId) return alert("Vui lòng chọn Lớp trước khi tìm.");
		fetchGet(`/api/student-profiles/by-class/${classId}`,
			(data) => {
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
				}));
				setStudents(mapped);
			},
			(err) => console.error(err)
		);
	};

	return (
		<div className="se-panel">
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

			<div className="se-table-wrap">
				<table className="se-table">
					<thead>
						<tr>
							    <th>STT</th>
								    <th>Họ và tên</th>
								    <th>Nhận xét cuối kì</th>
								    <th>KT CK1</th>
								    <th>XL CK1</th>
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
										<input value={s.finalEvaluation || ''} onChange={(e) => { s.finalEvaluation = e.target.value; setStudents([...students]); }} />
									</td>
									<td>
										<input value={s.ck1 || ''} onChange={(e) => { s.ck1 = e.target.value; setStudents([...students]); }} />
									</td>
									<td>
										<select value={s.xlck1 || ''} onChange={(e) => { s.xlck1 = e.target.value; setStudents([...students]); }}>
											<option value="">--Chọn--</option>
											<option>Xuất sắc</option>
											<option>Tốt</option>
											<option>Khá</option>
											<option>Trung bình</option>
										</select>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default SubjectTab;
