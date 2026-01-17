import React, { useEffect, useState } from "react";
import { createEvaluation, updateEvaluation, postQualityEvaluation } from "../../../lib/studentEvaluationService";
import { fetchGet } from "../../../lib/httpHandler";
import { getByClass as getFinalRecordsByClass } from "../../../lib/finalTermRecordService";

const defaultSemester = "Học kỳ 1";
const defaultYear = "2025-2026";

const qualityKeys = ["Yêu nước", "Nhân ái", "Chăm chỉ", "Trung thực", "Trách nhiệm"];
const subjectMetrics = ["KT CK", "XL CK"];

const HomeroomTab = () => {
  const [grade, setGrade] = useState("");
  const [classId, setClassId] = useState("");
  const [semester, setSemester] = useState(defaultSemester);
  const [schoolYear, setSchoolYear] = useState(defaultYear);
  const [teacherName, setTeacherName] = useState("GVCN: ---");
  const [students, setStudents] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [classSubjectsMap, setClassSubjectsMap] = useState({});
  const [subjectsForClass, setSubjectsForClass] = useState([]);

  useEffect(() => {
    if (classId) {
      // Lấy danh sách học sinh theo classId
      fetchGet(`/api/student-profiles/by-class/${classId}`,
        async (data) => {
          const arr = Array.isArray(data) ? data : [];
          // Map API response to object dùng trong UI
          const mapped = arr.map((it) => ({
            studentId: it.userId,
            studentName: it.userName,
            email: it.email,
            schoolId: it.schoolId,
            schoolName: it.schoolName,
            classId: it.classId,
            className: it.className,
            enrollDate: it.enrollDate,
            qualities: {},
            subjectScores: {},
          }));

          // Try to load existing final-term records for this class and map into per-student subjectScores
          try {
            const url = `/api/final-term-records/class/${classId}`;
            console.log('HomeroomTab: requesting final-term-records for classId:', classId, 'URL:', url);
            const records = await new Promise((resolve, reject) => {
              getFinalRecordsByClass(classId, resolve, reject, () => reject(new Error("Network error")));
            });
            const recArr = Array.isArray(records) ? records : [];
            console.log('HomeroomTab: final-term-records response count:', recArr.length, recArr.slice(0,5));
            for (const r of recArr) {
              const student = mapped.find(m => m.studentId === r.studentProfileId);
              if (student) {
                student.subjectScores = student.subjectScores || {};
                student.subjectScores[r.subjectId] = student.subjectScores[r.subjectId] || {};
                // map API fields to UI metric names
                student.subjectScores[r.subjectId]["KT CK"] = r.finalScore;
                student.subjectScores[r.subjectId]["XL CK"] = r.finalEvaluation;
                student.subjectScores[r.subjectId].comment = r.comment;
              }
            }
          } catch (e) {
            console.warn('HomeroomTab: Không tải được final-term-records cho lớp:', e);
          }

          setStudents(mapped);
          setTeacherName("GVCN: Nguyễn A");
        },
        (err) => console.error(err)
      );
    }
  }, [classId]);

  useEffect(() => {
    const accountId = localStorage.getItem("accountId");
    const teacherId = localStorage.getItem("teacherId") || accountId;

    const fetchClassesAndMappings = async () => {
      try {
        if (accountId) {
              try {
                const user = await new Promise((resolve, reject) => {
                  fetchGet(`/api/accounts/by-account/${accountId}`, resolve, reject, () => reject("exception"));
                });
                const homeroomTeacherId = user?.id || user?.teacherId || null;
                if (homeroomTeacherId) {
                  const classes = await new Promise((resolve, reject) => {
                      fetchGet(`/api/classes/by-homeroom-teacher/${homeroomTeacherId}`, resolve, reject, () => reject("exception"));
                    });
                    const clsArrRaw = Array.isArray(classes) ? classes : (classes ? [classes] : []);
                    setClassOptions(clsArrRaw.map((cls) => ({ classId: cls.id || cls.classId, className: cls.className || cls.name, grade: cls.grade || cls.gradeId })));
                }
              } catch (err) {
                console.error('Error loading classes by homeroom teacher', err);
                setClassOptions([]);
              }
            }
      } catch (err) {
        console.error("Error loading classes by school:", err);
        setClassOptions([]);
      }

      if (!teacherId) return;
      fetchGet(`/api/class-subjects/by-teacher/${teacherId}`,
        (data) => {
          const arr = Array.isArray(data) ? data : [];
          const map = {};
          arr.forEach((item) => {
            const cid = item.classId;
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
    // when a class is selected, fetch its subjects via by-class endpoint
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
    if (!classId) return alert("Vui lòng chọn Khối và Lớp");
    const promises = [];
    for (const s of students) {
      const payload = {
        studentId: s.studentId,
        classId,
        semester,
        schoolYear,
        finalScore: Number(s.finalScore) || 0,
        level: s.level || "",
        generalComment: s.generalComment || "",
        finalEvaluation: s.finalEvaluation || "",
      };
      if (s.id) promises.push(updateEvaluation(s.id, payload, () => {}, (e) => console.error(e), () => {}));
      else promises.push(createEvaluation(payload, () => {}, (e) => console.error(e), () => {}));

      // qualities
      if (s.qualities) {
        for (const qKey of Object.keys(s.qualities)) {
          const qVal = s.qualities[qKey];
          // postQualityEvaluation expects qualityId; we'll pass qKey as id for now
          promises.push(postQualityEvaluation(s.id || "", { studentEvaluationId: s.id || "", qualityId: qKey, qualityLevel: qVal }, () => {}, (e) => console.error(e), () => {}));
        }
      }
    }
    try {
      await Promise.all(promises);
      alert("Lưu sổ liên lạc thành công");
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
          qualities: {},
          subjectScores: {},
        }));
        setStudents(mapped);
      },
      (err) => console.error(err)
    );
  };

  const handleQualityChange = (studentIndex, quality, value) => {
    const copy = [...students];
    copy[studentIndex].qualities = { ...(copy[studentIndex].qualities || {}), [quality]: value };
    setStudents(copy);
  };

  const handleSubjectMetricChange = (studentIndex, subjectId, metric, value) => {
    const copy = [...students];
    const ss = copy[studentIndex].subjectScores || {};
    if (!ss[subjectId]) ss[subjectId] = {};
    // store numeric values for KT CK, keep strings for XL CK
    if (metric === "KT CK") {
      const num = value === '' ? '' : Number(value);
      ss[subjectId][metric] = num;
    } else {
      ss[subjectId][metric] = value;
    }
    copy[studentIndex].subjectScores = ss;
    setStudents(copy);
  };

  return (
    <div className="se-panel">
      <div className="se-controls">
        <label>
          Lớp
          <select value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">--Chọn Lớp--</option>
            {classOptions.map((c) => (
              <option key={c.classId} value={c.classId}>{c.className}</option>
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
        <div style={{display:'flex',alignItems:'flex-end', width: '100%'}}>
          <div style={{fontWeight:700}}>{teacherName}</div>
          <div style={{display:'flex',alignItems:'flex-end', gap:8, marginLeft: 'auto'}}>
            <button className="btn btn-search" onClick={handleFetchStudents}>Tìm</button>
            <button className="btn btn-save" onClick={handleBulkSave}>Lưu</button>
          </div>
        </div>
      </div>

      <div className="se-table-wrap" style={{ overflowX: 'auto' }}>
        <table className="se-table se-table-homeroom" style={{ minWidth: subjectsForClass && subjectsForClass.length ? 600 + subjectsForClass.length * 140 : 1000 }}>
          <thead>
              <tr>
                <th rowSpan={subjectsForClass && subjectsForClass.length > 0 ? 3 : 2}>STT</th>
              <th rowSpan={subjectsForClass && subjectsForClass.length > 0 ? 3 : 2}>Họ và tên</th>
              {subjectsForClass && subjectsForClass.length > 0 ? (
                <th colSpan={subjectsForClass.length * subjectMetrics.length}>Môn học</th>
              ) : (
                <th rowSpan={2}>Môn học</th>
              )}
            </tr>
            {subjectsForClass && subjectsForClass.length > 0 ? (
              <tr>
                {subjectsForClass.map((sub) => (
                  <th key={sub.subjectId} colSpan={subjectMetrics.length} style={{textAlign:'center'}}>{sub.subjectName}</th>
                ))}
                <th colSpan={qualityKeys.length}>Phẩm chất chủ yếu</th>
              </tr>
            ) : (
              <tr>
                {qualityKeys.map((q) => <th key={q}>{q}</th>)}
              </tr>
            )}
            {subjectsForClass && subjectsForClass.length > 0 ? (
                <tr>
                {subjectsForClass.map((sub) => (
                  subjectMetrics.map((m) => <th key={sub.subjectId + m} style={{ minWidth: 110 }}>{m}</th>)
                ))}
                {qualityKeys.map((q) => <th key={q}>{q}</th>)}
                <th>Đánh giá</th>
                <th>Ghi chú</th>
              </tr>
            ) : null}
          </thead>
          <tbody>
              {students.length === 0 ? (
              <tr>
                <td colSpan={2 + (subjectsForClass && subjectsForClass.length > 0 ? subjectsForClass.length * subjectMetrics.length : 1) + qualityKeys.length + 2} className="empty">Không có dữ liệu. Nhập mã lớp và chọn kỳ/năm.</td>
              </tr>
            ) : (
              students.map((s, idx) => (
                <tr key={s.studentId}>
                  <td style={{ minWidth: 40 }}>{idx + 1}</td>
                  <td style={{ minWidth: 180 }}>{s.studentName}</td>
                  {subjectsForClass && subjectsForClass.length > 0 ? (
                    // render subject metric cells per subject
                    subjectsForClass.map((sub) => (
                      subjectMetrics.map((m) => (
                        <td key={sub.subjectId + m}>
                          {m === "KT CK" ? (
                            <div style={{ width: 56, textAlign: 'center' }}>
                              {(s.subjectScores && s.subjectScores[sub.subjectId] && (s.subjectScores[sub.subjectId][m] !== undefined ? s.subjectScores[sub.subjectId][m] : '')) || ''}
                            </div>
                          ) : (
                            <div style={{ width: 100 }}>
                              {(s.subjectScores && s.subjectScores[sub.subjectId] && (s.subjectScores[sub.subjectId][m] !== undefined ? s.subjectScores[sub.subjectId][m] : '')) || ''}
                            </div>
                          )}
                        </td>
                      ))
                    ))
                  ) : (
                    <td>{(s.subjectComments || []).map(sc => sc.subjectName).join(', ') || '-'}</td>
                  )}
                  {qualityKeys.map((q) => (
                    <td key={q}>
                      <select style={{ width: 90 }} value={(s.qualities && s.qualities[q]) || ''} onChange={(e) => handleQualityChange(idx, q, e.target.value)}>
                        <option value="">--</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </td>
                  ))}
                  <td>
                    <select style={{ width: 110 }} value={s.homeroomEvaluation || ''} onChange={(e) => { s.homeroomEvaluation = e.target.value; setStudents([...students]); }}>
                      <option value="">--</option>
                      <option value="Đạt">Đạt</option>
                      <option value="Chưa đạt">Chưa đạt</option>
                    </select>
                  </td>
                  <td>
                    <input style={{ width: 160 }} value={s.homeroomNote || ''} onChange={(e) => { s.homeroomNote = e.target.value; setStudents([...students]); }} />
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

export default HomeroomTab;
