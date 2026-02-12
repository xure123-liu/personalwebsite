const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase, uploadToStorage } = require('./supabase');

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

console.log('=== 数据存储配置 ===');
console.log('使用 Supabase 数据库 + Storage（持久化）');
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 未设置，API 将无法正常工作');
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 内存存储，文件上传后转存到 Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('不支持的文件类型'));
  }
});

const handleMulterError = (err, req, res, next) => {
  if (!err) return next();
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: '文件大小超过限制（5MB）' });
    if (err.code === 'LIMIT_UNEXPECTED_FILE') return next();
    return res.status(400).json({ error: '文件上传错误: ' + err.message });
  }
  return res.status(400).json({ error: err.message || '文件上传失败' });
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// 初始化默认用户和 profile（仅当不存在时）
async function initDefaults() {
  if (!supabase) return;
  try {
    const { data: userRow } = await supabase.from('users').select('id').eq('username', 'Liuxueyou').maybeSingle();
    if (!userRow) {
      const hash = bcrypt.hashSync('5203013009LXYdsg', 10);
      await supabase.from('users').insert({ username: 'Liuxueyou', password: hash });
      console.log('✅ 已创建默认用户');
    }
    const { data: profileRow } = await supabase.from('profile').select('id').limit(1).maybeSingle();
    if (!profileRow) {
      await supabase.from('profile').insert({
        main_title: 'Building digital photos, brands and memories',
        sub_title: 'Nature itself inspires me',
        hero_description: 'I am passionate about travel and photography, specializing in elopement and lifestyle photography. I capture pure love and the essence of human beings.'
      });
      console.log('✅ 已创建默认 profile');
    }
  } catch (e) {
    console.error('初始化默认数据失败:', e);
  }
}

// ----- 登录 -----
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  const { data: user, error } = await supabase.from('users').select('*').eq('username', username).maybeSingle();
  if (error || !user) return res.status(401).json({ error: '用户名或密码错误' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: '用户名或密码错误' });
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

// ----- Profile -----
app.get('/api/profile', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  const { data, error } = await supabase.from('profile').select('*').order('id', { ascending: false }).limit(1).maybeSingle();
  if (error) return res.status(500).json({ error: '服务器错误' });
  res.json(data || {});
});

app.put('/api/profile', authenticateToken, upload.any(), handleMulterError, async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: '服务器错误' });
    const { name, main_title, sub_title, hero_description, about_description, skills, email, address, about_images_paths } = req.body;
    const files = req.files || [];
    const avatarFile = files.find(f => f.fieldname === 'avatar');
    const wechatQrFile = files.find(f => f.fieldname === 'wechat_qr');
    const qqQrFile = files.find(f => f.fieldname === 'qq_qr');
    const aboutImagesFiles = files.filter(f => f.fieldname === 'about_images');

    const { data: existing } = await supabase.from('profile').select('*').order('id', { ascending: false }).limit(1).maybeSingle();

    let avatar = existing?.avatar || null;
    let wechat_qr = existing?.wechat_qr || null;
    let qq_qr = existing?.qq_qr || null;
    if (avatarFile) avatar = await uploadToStorage(avatarFile.buffer, avatarFile.originalname, avatarFile.mimetype);
    if (wechatQrFile) wechat_qr = await uploadToStorage(wechatQrFile.buffer, wechatQrFile.originalname, wechatQrFile.mimetype);
    if (qqQrFile) qq_qr = await uploadToStorage(qqQrFile.buffer, qqQrFile.originalname, qqQrFile.mimetype);

    let aboutImagesArray = [];
    if (about_images_paths !== undefined && about_images_paths !== null) {
      const trimmed = String(about_images_paths).trim();
      if (trimmed !== '' && trimmed !== '[]') {
        try {
          const parsed = JSON.parse(about_images_paths);
          if (Array.isArray(parsed)) aboutImagesArray = parsed;
          else if (existing?.about_images) try { aboutImagesArray = JSON.parse(existing.about_images); } catch (_) {}
        } catch (_) {
          if (existing?.about_images) try { aboutImagesArray = JSON.parse(existing.about_images); } catch (_) {}
        }
      }
    } else if (existing?.about_images) {
      try { aboutImagesArray = JSON.parse(existing.about_images); } catch (_) {}
    }
    for (const file of aboutImagesFiles) {
      const url = await uploadToStorage(file.buffer, file.originalname, file.mimetype);
      if (url) aboutImagesArray.push(url);
    }
    if (aboutImagesArray.length > 5) aboutImagesArray = aboutImagesArray.slice(0, 5);
    const about_images = JSON.stringify(aboutImagesArray);

    const safe = v => (v === undefined || v === null) ? null : v;
    const row = {
      avatar: safe(avatar), name: safe(name), main_title: safe(main_title), sub_title: safe(sub_title),
      hero_description: safe(hero_description), about_description: safe(about_description), about_images,
      skills: safe(skills), wechat_qr: safe(wechat_qr), qq_qr: safe(qq_qr), email: safe(email), address: safe(address)
    };

    if (existing) {
      const { error } = await supabase.from('profile').update(row).eq('id', existing.id);
      if (error) return res.status(500).json({ error: '更新失败: ' + error.message });
      const { data: updated } = await supabase.from('profile').select('*').eq('id', existing.id).single();
      return res.json({ message: '更新成功', data: updated });
    }
    const { data: inserted, error } = await supabase.from('profile').insert(row).select('*').single();
    if (error) return res.status(500).json({ error: '创建失败: ' + error.message });
    res.json({ message: '创建成功', data: inserted });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '服务器错误: ' + e.message });
  }
});

// ----- Works -----
app.get('/api/works', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  const { category } = req.query;
  let q = supabase.from('works').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false });
  if (category && category !== 'All') q = q.eq('category', category);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: '服务器错误' });
  res.json(data || []);
});

app.get('/api/works/:id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  const { data, error } = await supabase.from('works').select('*').eq('id', req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: '服务器错误' });
  if (!data) return res.status(404).json({ error: '作品不存在' });
  res.json(data);
});

app.post('/api/works', authenticateToken, (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err && (!(err instanceof multer.MulterError) || err.code !== 'LIMIT_UNEXPECTED_FILE')) return handleMulterError(err, req, res, next);
    next();
  });
}, async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: '服务器错误' });
    const { name, description, category, images_paths, sort_order } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: '作品名称不能为空' });
    const files = req.files || [];
    let image = null;
    const imageFile = files.find(f => f.fieldname === 'image');
    if (imageFile) image = await uploadToStorage(imageFile.buffer, imageFile.originalname, imageFile.mimetype);

    let imagesArray = [];
    if (images_paths && String(images_paths).trim() && String(images_paths).trim() !== '[]') {
      try { const p = JSON.parse(images_paths); if (Array.isArray(p)) imagesArray = p; } catch (_) {}
    }
    const imagesFiles = files.filter(f => f.fieldname === 'images');
    for (const f of imagesFiles) {
      const url = await uploadToStorage(f.buffer, f.originalname, f.mimetype);
      if (url) imagesArray.push(url);
    }
    const images = JSON.stringify(imagesArray);
    const sortOrder = sort_order != null ? parseInt(sort_order) : 0;

    const { data: inserted, error } = await supabase.from('works').insert({
      name: name.trim(), description: description || '', image, images, category: category || '', sort_order: sortOrder
    }).select('id').single();
    if (error) return res.status(500).json({ error: '创建失败: ' + error.message });
    res.json({ id: inserted.id, message: '创建成功' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/works/:id', authenticateToken, (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err && (!(err instanceof multer.MulterError) || err.code !== 'LIMIT_UNEXPECTED_FILE')) return handleMulterError(err, req, res, next);
    next();
  });
}, async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: '服务器错误' });
    const id = req.params.id;
    const { data: work } = await supabase.from('works').select('*').eq('id', id).maybeSingle();
    if (!work) return res.status(404).json({ error: '作品不存在' });

    const { name, description, category, images_paths, sort_order } = req.body;
    const files = req.files || [];
    let image = work.image;
    const imageFile = files.find(f => f.fieldname === 'image');
    if (imageFile) image = await uploadToStorage(imageFile.buffer, imageFile.originalname, imageFile.mimetype);

    let imagesArray = [];
    if (images_paths !== undefined && images_paths !== null) {
      const t = String(images_paths).trim();
      if (t === '' || t === '[]') imagesArray = [];
      else {
        try { const p = JSON.parse(images_paths); if (Array.isArray(p)) imagesArray = p; else if (work.images) imagesArray = JSON.parse(work.images); } catch (_) { if (work.images) try { imagesArray = JSON.parse(work.images); } catch (_) {} }
      }
    } else if (work.images) try { imagesArray = JSON.parse(work.images); } catch (_) {}
    const imagesFiles = files.filter(f => f.fieldname === 'images');
    for (const f of imagesFiles) {
      const url = await uploadToStorage(f.buffer, f.originalname, f.mimetype);
      if (url) imagesArray.push(url);
    }
    const images = JSON.stringify(imagesArray);
    const sortOrder = sort_order != null ? parseInt(sort_order) : (work.sort_order || 0);

    const { error } = await supabase.from('works').update({
      name: (name != null ? name : work.name).toString(),
      description: (description != null ? description : work.description) || '',
      image, images, category: (category != null ? category : work.category) || '', sort_order: sortOrder
    }).eq('id', id);
    if (error) return res.status(500).json({ error: '更新失败: ' + error.message });
    res.json({ message: '更新成功' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/works/:id', authenticateToken, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  const { error } = await supabase.from('works').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: '删除失败' });
  res.json({ message: '删除成功' });
});

app.put('/api/works/sort', authenticateToken, async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: '无效的排序数据' });
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  for (const item of items) {
    await supabase.from('works').update({ sort_order: item.sort_order }).eq('id', item.id);
  }
  res.json({ message: '排序更新成功' });
});

// ----- Thoughts -----
app.get('/api/thoughts', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  const { data, error } = await supabase.from('thoughts').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: '服务器错误' });
  res.json(data || []);
});

app.get('/api/thoughts/:id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  const { data, error } = await supabase.from('thoughts').select('*').eq('id', req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: '服务器错误' });
  if (!data) return res.status(404).json({ error: '思考不存在' });
  res.json(data);
});

app.post('/api/thoughts', authenticateToken, upload.any(), handleMulterError, async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: '服务器错误' });
    const { title, content, content_detail, images_paths, sort_order } = req.body;
    const files = req.files || [];
    let image = null;
    const imageFile = files.find(f => f.fieldname === 'image');
    if (imageFile) image = await uploadToStorage(imageFile.buffer, imageFile.originalname, imageFile.mimetype);

    let imagesArray = [];
    if (images_paths && String(images_paths).trim() && String(images_paths).trim() !== '[]') {
      try { const p = JSON.parse(images_paths); if (Array.isArray(p)) imagesArray = p; } catch (_) {}
    }
    const imagesFiles = files.filter(f => f.fieldname === 'images');
    for (const f of imagesFiles) {
      const url = await uploadToStorage(f.buffer, f.originalname, f.mimetype);
      if (url) imagesArray.push(url);
    }
    const images = JSON.stringify(imagesArray);
    const sortOrder = sort_order != null ? parseInt(sort_order) : 0;

    const { data: inserted, error } = await supabase.from('thoughts').insert({
      title: (title || '').toString(), content: (content || '').toString(), content_detail: (content_detail || '').toString(),
      image, images, sort_order: sortOrder
    }).select('id').single();
    if (error) return res.status(500).json({ error: '创建失败: ' + error.message });
    res.json({ id: inserted.id, message: '创建成功' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/thoughts/:id', authenticateToken, upload.any(), handleMulterError, async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: '服务器错误' });
    const id = req.params.id;
    const { data: thought } = await supabase.from('thoughts').select('*').eq('id', id).maybeSingle();
    if (!thought) return res.status(404).json({ error: '思考不存在' });

    const { title, content, content_detail, images_paths, sort_order } = req.body;
    const files = req.files || [];
    let image = thought.image;
    const imageFile = files.find(f => f.fieldname === 'image');
    if (imageFile) image = await uploadToStorage(imageFile.buffer, imageFile.originalname, imageFile.mimetype);

    let imagesArray = [];
    if (images_paths !== undefined && images_paths !== null) {
      const t = String(images_paths).trim();
      if (t === '' || t === '[]') imagesArray = [];
      else {
        try { const p = JSON.parse(images_paths); if (Array.isArray(p)) imagesArray = p; else if (thought.images) imagesArray = JSON.parse(thought.images); } catch (_) { if (thought.images) try { imagesArray = JSON.parse(thought.images); } catch (_) {} }
      }
    } else if (thought.images) try { imagesArray = JSON.parse(thought.images); } catch (_) {}
    const imagesFiles = files.filter(f => f.fieldname === 'images');
    for (const f of imagesFiles) {
      const url = await uploadToStorage(f.buffer, f.originalname, f.mimetype);
      if (url) imagesArray.push(url);
    }
    const images = JSON.stringify(imagesArray);
    const sortOrder = sort_order != null ? parseInt(sort_order) : (thought.sort_order || 0);

    const { error } = await supabase.from('thoughts').update({
      title: (title != null ? title : thought.title).toString(),
      content: (content != null ? content : thought.content) || '',
      content_detail: (content_detail != null ? content_detail : thought.content_detail) || '',
      image, images, sort_order: sortOrder
    }).eq('id', id);
    if (error) return res.status(500).json({ error: '更新失败: ' + error.message });
    res.json({ message: '更新成功' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/thoughts/:id', authenticateToken, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  const { error } = await supabase.from('thoughts').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: '删除失败' });
  res.json({ message: '删除成功' });
});

app.put('/api/thoughts/sort', authenticateToken, async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: '无效的排序数据' });
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  for (const item of items) {
    await supabase.from('thoughts').update({ sort_order: item.sort_order }).eq('id', item.id);
  }
  res.json({ message: '排序更新成功' });
});

// ----- Gallery -----
app.get('/api/gallery', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: '服务器错误' });
  res.json(data || []);
});

app.post('/api/gallery', authenticateToken, upload.single('image'), handleMulterError, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  const { name, description } = req.body;
  let image = null;
  if (req.file) image = await uploadToStorage(req.file.buffer, req.file.originalname, req.file.mimetype);
  const { data: inserted, error } = await supabase.from('gallery').insert({ name: name || '', description: description || '', image }).select('id').single();
  if (error) return res.status(500).json({ error: '创建失败' });
  res.json({ id: inserted.id, message: '创建成功' });
});

app.put('/api/gallery/:id', authenticateToken, upload.single('image'), handleMulterError, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  const id = req.params.id;
  const { data: item } = await supabase.from('gallery').select('*').eq('id', id).maybeSingle();
  if (!item) return res.status(404).json({ error: '图册不存在' });
  let image = item.image;
  if (req.file) image = await uploadToStorage(req.file.buffer, req.file.originalname, req.file.mimetype);
  const { error } = await supabase.from('gallery').update({ name: req.body.name || item.name, description: req.body.description != null ? req.body.description : item.description, image }).eq('id', id);
  if (error) return res.status(500).json({ error: '更新失败' });
  res.json({ message: '更新成功' });
});

app.delete('/api/gallery/:id', authenticateToken, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  const { error } = await supabase.from('gallery').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: '删除失败' });
  res.json({ message: '删除成功' });
});

// ----- Messages -----
app.post('/api/messages', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: '请填写所有必填字段' });
  if (!email.includes('@') || !email.includes('.')) return res.status(400).json({ error: '邮箱格式不正确' });
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  const { data: inserted, error } = await supabase.from('messages').insert({ name, email, message }).select('id').single();
  if (error) return res.status(500).json({ error: '提交失败' });
  res.json({ id: inserted.id, message: '提交成功' });
});

app.get('/api/messages', authenticateToken, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: '服务器错误' });
  res.json(data || []);
});

app.put('/api/messages/:id', authenticateToken, async (req, res) => {
  const { status } = req.body;
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  const { error } = await supabase.from('messages').update({ status }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: '更新失败' });
  res.json({ message: '更新成功' });
});

app.delete('/api/messages/:id', authenticateToken, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  const { error } = await supabase.from('messages').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: '删除失败' });
  res.json({ message: '删除成功' });
});

// ----- Links -----
app.get('/api/links', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  const { data, error } = await supabase.from('links').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: '服务器错误' });
  res.json(data || []);
});

app.post('/api/links', authenticateToken, async (req, res) => {
  const { name, url } = req.body;
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  const { data: inserted, error } = await supabase.from('links').insert({ name: name || '', url: url || '' }).select('id').single();
  if (error) return res.status(500).json({ error: '创建失败' });
  res.json({ id: inserted.id, message: '创建成功' });
});

app.put('/api/links/:id', authenticateToken, async (req, res) => {
  const { name, url } = req.body;
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  const { error } = await supabase.from('links').update({ name: name || '', url: url || '' }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: '更新失败' });
  res.json({ message: '更新成功' });
});

app.delete('/api/links/:id', authenticateToken, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: '服务器错误' });
  const { error } = await supabase.from('links').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: '删除失败' });
  res.json({ message: '删除成功' });
});

// 启动：先初始化默认数据，再监听
initDefaults().then(() => {
  app.listen(PORT, () => {
    console.log('✅ Server running on port ' + PORT);
    console.log('✅ 使用 Supabase 数据库 + Storage，数据持久化');
  });
}).catch((e) => {
  console.error('初始化失败:', e);
  app.listen(PORT, () => {
    console.log('✅ Server running on port ' + PORT);
    console.warn('⚠️  初始化默认数据失败，请检查 Supabase 配置');
  });
});
