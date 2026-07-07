-- Seed data from resume (May 2026) + Figma. Idempotent via fixed UUIDs.

insert into profile (id, name, tagline, bio, github_username, email, linkedin_url, education)
values (
  1,
  'Nishant Prabhat',
  'AI / ML engineer in the making',
  'B.Tech CSE student at IIIT Guwahati building agentic AI systems, ML models, and the occasional robot.',
  'iampruh887',
  'iampruh887@gmail.com',
  'https://linkedin.com/in/nishant-prabhat',
  'B.Tech in Computer Science and Engineering, Indian Institute of Information Technology Guwahati (CPI 7.49), Aug 2023 – Present'
)
on conflict (id) do nothing;

insert into projects (id, title, description, tech, date_label, sort_order) values
('11111111-0000-0000-0000-000000000001',
 'Hybrid Multi-Tier GPU Offloading for Memory Wall',
 'Three-tier GPU execution model (GPU-PIC, GPU-LLC, GPU-PIM) reducing the memory wall through selective offloading. MSHR-based offload detection and threshold routing in GPGPU-Sim across cache and L2 controllers, with multi-tier scheduling and alternate timing paths for hierarchical execution validation.',
 array['C++','GPGPU-Sim','GPU Architecture'], 'Apr 2026', 1),
('11111111-0000-0000-0000-000000000002',
 'AI Representation Optimizer',
 'Agentic architecture orchestrating specialized agents for e-commerce store analysis and optimization. Planner/worker agent orchestration with task decomposition, LLM-driven aggregation, and an LLM interface for chained reasoning and context-aware merchant recommendations.',
 array['JavaScript','Node.js','Ollama','Agent Orchestration'], 'Apr 2026', 2),
('11111111-0000-0000-0000-000000000003',
 'DeepFake Audio Detection',
 'Deepfake speech classification using Wav2Vec2 with gradient checkpointing and mixed-precision training. Audiomentations-based augmentation for robust multi-class classification across 4 speech classes; optimized PyTorch pipeline for the ComSys 6 hackathon.',
 array['Python','PyTorch','Transformers','Wav2Vec2','Librosa'], 'Oct 2025', 3),
('11111111-0000-0000-0000-000000000004',
 'Facial Recognition and Classification',
 'Dual pipelines for facial verification (88.26% accuracy, 92.56% precision) using FaceNet embeddings, and gender classification with EfficientNet-B0 (92.38% accuracy, 0.93 F1) for ComSys Hackathon 5.',
 array['Python','PyTorch','FaceNet','EfficientNet-B0','MTCNN'], 'Jul 2025', 4),
('11111111-0000-0000-0000-000000000005',
 'Visually Controlled Robotic Arm',
 'Vision-guided robotic arm for real-time hand gesture tracking and laser pointer control. ESP32 + Arduino firmware for motor control, with robust hand detection and gesture recognition via OpenCV and MediaPipe.',
 array['ESP32','Arduino','OpenCV','MediaPipe'], 'Mar 2025', 5),
('11111111-0000-0000-0000-000000000006',
 'nanoGPT on Hindi Literature',
 'Trained a nanoGPT model on a Hindi literature corpus to generate text in Devanagari.',
 array['Python','PyTorch','nanoGPT'], '2024', 6),
('11111111-0000-0000-0000-000000000007',
 'Implementing CLIP from Scratch',
 'Re-implemented the CLIP contrastive image–text architecture from scratch.',
 array['Python','PyTorch'], '2024', 7),
('11111111-0000-0000-0000-000000000008',
 'Lunar Lander Optimization',
 'Reinforcement-learning agent solving Gymnasium LunarLander.',
 array['Python','Reinforcement Learning'], '2024', 8),
('11111111-0000-0000-0000-000000000009',
 'Fashion MNIST Classifier',
 'CNN classifier for the Fashion-MNIST dataset.',
 array['Python','PyTorch'], '2023', 9),
('11111111-0000-0000-0000-000000000010',
 'Bigram Language Model',
 'Character-level bigram language model built from first principles.',
 array['Python'], '2023', 10)
on conflict (id) do nothing;

insert into experiences (id, role, org, location, description, start_date, end_date, is_current, kind, sort_order) values
('22222222-0000-0000-0000-000000000001',
 'AI Intern', 'Stealth Startup', 'Remote',
 'Built agentic AI systems across two internship terms: prototyped agents with tool use, memory, and task decomposition using LangChain and Google ADK; then built an AutoML platform for industrial datasets and shipped a full platform (AutoML + RAG assistant + image segmentation) to Azure, including automated root-cause analysis and dataset merging.',
 '2025-07-01', '2026-04-30', false, 'work', 1),
('22222222-0000-0000-0000-000000000003',
 'Python Intern', 'Jobmato', 'Remote',
 'Built large-scale web scraping and structured data ingestion pipelines for candidate-job mapping.',
 '2025-03-01', '2025-08-31', false, 'work', 3),
('22222222-0000-0000-0000-000000000004',
 'Research Intern', 'DLRL, DRDO', 'Hyderabad, Telangana',
 'Explored and benchmarked neural translation models (RNN, LSTM, GRU) for low-resource Indian languages; presented findings to senior scientists.',
 '2024-05-01', '2024-07-31', false, 'work', 4),
('22222222-0000-0000-0000-000000000005',
 'ML Society Coordinator', 'IIIT Guwahati', 'Guwahati, Assam',
 'Coordinator of the ML Society.', null, null, true, 'activity', 5),
('22222222-0000-0000-0000-000000000006',
 'Tech Head — INIZIO''25', 'IIIT Guwahati', 'Guwahati, Assam',
 'Tech head for the INIZIO''25 hackathon.', null, null, false, 'activity', 6),
('22222222-0000-0000-0000-000000000007',
 'Reading Club Coordinator', 'IIIT Guwahati', 'Guwahati, Assam',
 'Coordinator of the Reading Club.', null, null, true, 'activity', 7)
on conflict (id) do nothing;

insert into languages (id, name, rating, sort_order) values
('33333333-0000-0000-0000-000000000001', 'English', 5, 1),
('33333333-0000-0000-0000-000000000002', 'Hindi', 4, 2),
('33333333-0000-0000-0000-000000000003', 'Telugu', 3, 3),
('33333333-0000-0000-0000-000000000004', 'Assamese', 4, 4)
on conflict (id) do nothing;

insert into skills (id, name, category, icon_slug, sort_order) values
('44444444-0000-0000-0000-000000000001', 'Python', 'language', 'python', 1),
('44444444-0000-0000-0000-000000000002', 'Java', 'language', 'openjdk', 2),
('44444444-0000-0000-0000-000000000003', 'C/C++', 'language', 'cplusplus', 3),
('44444444-0000-0000-0000-000000000004', 'Go', 'language', 'go', 4),
('44444444-0000-0000-0000-000000000005', 'JavaScript', 'language', 'javascript', 5),
('44444444-0000-0000-0000-000000000006', 'React', 'framework', 'react', 6),
('44444444-0000-0000-0000-000000000007', 'Node.js', 'framework', 'nodedotjs', 7),
('44444444-0000-0000-0000-000000000008', 'Flask', 'framework', 'flask', 8),
('44444444-0000-0000-0000-000000000009', 'FastAPI', 'framework', 'fastapi', 9),
('44444444-0000-0000-0000-000000000010', 'PyTorch', 'library', 'pytorch', 10),
('44444444-0000-0000-0000-000000000011', 'NumPy', 'library', 'numpy', 11),
('44444444-0000-0000-0000-000000000012', 'OpenCV', 'library', 'opencv', 12),
('44444444-0000-0000-0000-000000000013', 'MediaPipe', 'library', 'mediapipe', 13),
('44444444-0000-0000-0000-000000000014', 'Scrapy', 'library', 'scrapy', 14),
('44444444-0000-0000-0000-000000000015', 'LangChain', 'ai_tool', 'langchain', 15),
('44444444-0000-0000-0000-000000000016', 'RAG', 'ai_tool', '', 16),
('44444444-0000-0000-0000-000000000017', 'Agent Systems', 'ai_tool', '', 17),
('44444444-0000-0000-0000-000000000018', 'n8n', 'ai_tool', 'n8n', 18),
('44444444-0000-0000-0000-000000000019', 'Git', 'dev_tool', 'git', 19),
('44444444-0000-0000-0000-000000000020', 'Arduino', 'dev_tool', 'arduino', 20),
('44444444-0000-0000-0000-000000000021', 'ESP32', 'dev_tool', 'espressif', 21)
on conflict (id) do nothing;

insert into blogs (id, title, slug, content, sort_order) values
('55555555-0000-0000-0000-000000000001', 'Hello World', 'hello-world',
 'First post — this blog is now served from Supabase. Edit or delete me in /admin.', 1)
on conflict (id) do nothing;
