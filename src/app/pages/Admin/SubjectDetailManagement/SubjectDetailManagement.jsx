// src/components/Admin/SubjectDetailManagement/SubjectDetailManagement.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	Box,
	Typography,
	IconButton,
	Avatar,
	Chip,
	CircularProgress,
	Card,
	CardContent,
	Link,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SchoolIcon from "@mui/icons-material/School";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { fetchGet } from "../../../lib/httpHandler.js";

// Components
import AddTopic from "../../../components/Admin/SubjectDetailManagement/AddTopic/AddTopic.jsx";
import TopicList from "./TopicList.jsx";
import TopicContent from "./TopicContent.jsx";
import AddLessonDialog from "./AddLessonDialog.jsx";
import AddExerciseDialog from "./AddExerciseDialog.jsx";

export default function SubjectDetailManagement() {
	const { subjectId } = useParams();
	const navigate = useNavigate();

	const [subject, setSubject] = useState(null);
	const [loadingSubject, setLoadingSubject] = useState(true);

	const [topics, setTopics] = useState([]);
	const [selectedTopicId, setSelectedTopicId] = useState("");
	const [loadingTopics, setLoadingTopics] = useState(true);

	const [lessons, setLessons] = useState([]);
	const [exercises, setExercises] = useState([]);
	const [selectedLesson, setSelectedLesson] = useState(null);
	const [tabValue, setTabValue] = useState(0);
	const [loadingContent, setLoadingContent] = useState(false);

	const [searchContent, setSearchContent] = useState("");
	const [openAddLesson, setOpenAddLesson] = useState(false);
	const [openAddExercise, setOpenAddExercise] = useState(false);
	const [openAddTopic, setOpenAddTopic] = useState(false);

	// Load môn học
	useEffect(() => {
		setLoadingSubject(true);
		fetchGet(
			`/api/Subjects/${subjectId}`,
			(data) => {
				setSubject(data || { name: "Không xác định", category: "N/A" });
				setLoadingSubject(false);
			},
			() => {
				toast.error("Lỗi tải môn học");
				setLoadingSubject(false);
			}
		);
	}, [subjectId]);

	// Load danh sách chủ đề
	const loadTopics = () => {
		setLoadingTopics(true);
		fetchGet(
			`/api/topics/by-subject/${subjectId}`,
			(data) => {
				const list = Array.isArray(data) ? data : [];
				setTopics(list);
				if (list.length > 0 && !selectedTopicId) {
					setSelectedTopicId(list[0].id);
				}
			},
			() => toast.error("Không tải được chủ đề")
		).finally(() => setLoadingTopics(false));
	};

	useEffect(() => {
		loadTopics();
	}, [subjectId]);

	// Load bài học theo topic – DÙNG CALLBACK ĐÚNG CÁCH
	const loadTopicContent = (topicId) => {
		if (!topicId) return;

		setLoadingContent(true);
		setLessons([]);
		setExercises([]);
		setSelectedLesson(null);
		setSearchContent("");

		fetchGet(
			`/api/lessons/by-topic/${topicId}`,
			(data) => {
				const lessonList = Array.isArray(data) ? data : [];
				setLessons(lessonList);

				// After lessons loaded, load exercises by topic (exercises belong to topic now)
				fetchGet(
					`/api/exercises/by-topic/${topicId}`,
					(exData) => {
						setExercises(Array.isArray(exData) ? exData : []);
						setLoadingContent(false);
					},
					() => {
						toast.error("Lỗi tải bài tập");
						setExercises([]);
						setLoadingContent(false);
					}
				);
			},
			() => {
				toast.error("Lỗi tải bài học");
				setLessons([]);
				setExercises([]);
				setLoadingContent(false);
			}
		);
	};

	useEffect(() => {
		if (selectedTopicId) {
			loadTopicContent(selectedTopicId);
			setTabValue(0);
		}
	}, [selectedTopicId]);

	// Khi chọn bài học → chỉ chọn lesson (exercises là theo topic)
	const handleSelectLesson = (lesson) => {
		// Nếu gọi với null => quay về danh sách (không thay header)
		if (!lesson) {
			setSelectedLesson(null);
			setTabValue(0);
			setSearchContent("");
			return;
		}

		// Chỉ set selected lesson; exercises là theo topic và đã được load trong loadTopicContent
		setSelectedLesson(lesson);
		setTabValue(0);
		setSearchContent("");
	};

	const handleLessonAdded = () => {
		loadTopicContent(selectedTopicId);
	};

	const handleExerciseAdded = () => {
		// Refresh exercises for current topic (do not clear selectedLesson)
		if (selectedTopicId) {
			fetchGet(
				`/api/exercises/by-topic/${selectedTopicId}`,
				(data) => {
					setExercises(Array.isArray(data) ? data : []);
				},
				() => {
					toast.error("Lỗi tải bài tập");
					setExercises([]);
				}
			);
		}
	};

	if (loadingSubject) {
		return (
			<Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
				<CircularProgress size={60} />
			</Box>
		);
	}

	return (
		<Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8fafc" }}>
			<ToastContainer />

			{/* Cột trái */}
			<TopicList
				topics={topics}
				loading={loadingTopics}
				selectedTopicId={selectedTopicId}
				onSelectTopic={(id) => {
					setSelectedTopicId(id);
					loadTopicContent(id); // Gọi lại để reload ngay
				}}
				onOpenAddTopic={() => setOpenAddTopic(true)}
			/>

			{/* Cột phải */}
			<Box flex={1} p={4} overflow="auto">
				<Box display="flex" alignItems="center" gap={2} mb={3}>
					<IconButton onClick={() => navigate(-1)} sx={{ bgcolor: "white", boxShadow: 2 }}>
						<ArrowBackIcon />
					</IconButton>
					<Avatar sx={{ bgcolor: "primary.main", width: 50, height: 50 }}>
						<SchoolIcon />
					</Avatar>
					<Box>
						<Typography variant="h4" fontWeight={700}>
							{subject?.name || "Đang tải..."}
						</Typography>
						<Box display="flex" gap={2} alignItems="center" mt={1}>
							<Chip label={subject?.category || "N/A"} color="primary" size="small" />
							<Typography variant="body2" color="text.secondary">
								{subject?.description || "Chưa có mô tả"}
							</Typography>
						</Box>
					</Box>
				</Box>

				{/* ALWAYS render TopicContent (LessonList inside it will replace list with detail when selectedLesson != null) */}
				<TopicContent
					selectedTopicId={selectedTopicId}
					lessons={lessons}
					exercises={exercises}
					selectedLesson={selectedLesson}
					tabValue={tabValue}
					onTabChange={setTabValue}
					onSelectLesson={handleSelectLesson}
					searchContent={searchContent}
					onSearchContent={setSearchContent}
					onOpenAddLesson={() => setOpenAddLesson(true)}
					onOpenAddExercise={() => setOpenAddExercise(true)}
					loadingContent={loadingContent}
				/>
			</Box>

			{/* Dialogs */}
			<AddTopic
				open={openAddTopic}
				onClose={() => setOpenAddTopic(false)}
				subjectId={subjectId}
				onSuccess={loadTopics}
			/>

			<AddLessonDialog
				open={openAddLesson}
				onClose={() => setOpenAddLesson(false)}
				topicId={selectedTopicId}
				onSuccess={handleLessonAdded}
			/>

			<AddExerciseDialog
				open={openAddExercise}
				onClose={() => setOpenAddExercise(false)}
				topicId={selectedTopicId}
				onSuccess={handleExerciseAdded}
			/>
		</Box>
	);
}