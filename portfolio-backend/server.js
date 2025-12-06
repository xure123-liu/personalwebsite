const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // 支持 multipart/form-data 中的文本字段
app.use('/uploads', express.static('uploads'));

// 确保uploads目录存在
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// 数据库初始化
const db = new sqlite3.Database('portfolio.db');

// 创建表
db.serialize(() => {
  // 用户表（用于登录）
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);

  // 个人信息表
  db.run(`CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    avatar TEXT,
    name TEXT,
    main_title TEXT,
    sub_title TEXT,
    hero_description TEXT,
    about_description TEXT,
    about_images TEXT,
    skills TEXT,
    wechat_qr TEXT,
    qq_qr TEXT,
    email TEXT,
    address TEXT
  )`);

  // 检查并添加新字段（用于已存在的数据库）
  db.run(`ALTER TABLE profile ADD COLUMN name TEXT`, () => {});
  db.run(`ALTER TABLE profile ADD COLUMN hero_description TEXT`, () => {});
  db.run(`ALTER TABLE profile ADD COLUMN about_description TEXT`, () => {});
  db.run(`ALTER TABLE profile ADD COLUMN about_images TEXT`, () => {});
  db.run(`ALTER TABLE profile ADD COLUMN address TEXT`, () => {});
  db.run(`ALTER TABLE works ADD COLUMN images TEXT`, () => {});
  db.run(`ALTER TABLE works ADD COLUMN sort_order INTEGER DEFAULT 0`, () => {});
  db.run(`ALTER TABLE thoughts ADD COLUMN images TEXT`, () => {});
  db.run(`ALTER TABLE thoughts ADD COLUMN sort_order INTEGER DEFAULT 0`, () => {});

  // 作品表
  db.run(`CREATE TABLE IF NOT EXISTS works (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    images TEXT,
    link TEXT,
    category TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 思考沉淀表
  db.run(`CREATE TABLE IF NOT EXISTS thoughts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    image TEXT,
    images TEXT,
    link TEXT,
    views INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 图册表
  db.run(`CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 留言表
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 友情链接表
  db.run(`CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 初始化默认用户
  db.get('SELECT * FROM users WHERE username = ?', ['Liuxueyou'], (err, row) => {
    if (!row) {
      const hashedPassword = bcrypt.hashSync('5203013009LXYdsg', 10);
      db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['Liuxueyou', hashedPassword]);
    }
  });

  // 初始化默认个人信息
  db.get('SELECT * FROM profile', (err, row) => {
    if (!row) {
      db.run(`INSERT INTO profile (main_title, sub_title, description) 
              VALUES (?, ?, ?)`, 
        ['Building digital photos, brands and memories', 
         'Nature itself inspires me',
         'I am passionate about travel and photography, specializing in elopement and lifestyle photography. I capture pure love and the essence of human beings.']);
    }
  });
});

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// Multer错误处理中间件
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error('Multer错误:', err);
    console.error('错误代码:', err.code);
    console.error('错误字段:', err.field);
    console.error('错误消息:', err.message);
    
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: '文件大小超过限制（5MB）' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: '文件数量超过限制' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        // LIMIT_UNEXPECTED_FILE 在使用 upload.any() 时不应该出现，但如果有，我们忽略它
        console.warn('收到 LIMIT_UNEXPECTED_FILE 错误，但使用 upload.any() 应该允许所有字段');
        // 继续处理，不返回错误
        return next();
      }
      return res.status(400).json({ error: '文件上传错误: ' + err.message });
    }
    // 其他错误（如文件类型错误）
    return res.status(400).json({ error: err.message || '文件上传失败' });
  }
  next();
};

// 认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// 登录
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  });
});

// 获取个人信息
app.get('/api/profile', (req, res) => {
  db.get('SELECT * FROM profile ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    res.json(row || {});
  });
});

// 更新个人信息
// 使用 upload.any() 允许所有字段，然后手动处理文件
app.put('/api/profile', authenticateToken, upload.any(), (req, res) => {
  try {
    const { name, main_title, sub_title, hero_description, about_description, skills, email, address, about_images_paths } = req.body;
    
    // 手动处理文件：从 req.files 数组中提取对应的文件
    // upload.any() 返回的是数组，不是对象
    const files = req.files || [];
    const avatarFile = files.find(f => f.fieldname === 'avatar');
    const wechatQrFile = files.find(f => f.fieldname === 'wechat_qr');
    const qqQrFile = files.find(f => f.fieldname === 'qq_qr');
    const aboutImagesFiles = files.filter(f => f.fieldname === 'about_images');
    
    // 打印接收到的数据（用于调试）
    console.log('接收到的数据:', {
      name, main_title, sub_title, hero_description, about_description, 
      skills, email, address, about_images_paths,
      files: files.map(f => ({ fieldname: f.fieldname, filename: f.filename }))
    });
    
    // about_images_paths是前端传来的现有图片路径JSON字符串
    const about_images = about_images_paths;
    
    db.get('SELECT * FROM profile ORDER BY id DESC LIMIT 1', (err, existing) => {
      if (err) {
        console.error('查询profile失败:', err);
        return res.status(500).json({ error: '服务器错误: ' + err.message });
      }

      const avatar = avatarFile ? `/uploads/${avatarFile.filename}` : (existing?.avatar || null);
      const wechat_qr = wechatQrFile ? `/uploads/${wechatQrFile.filename}` : (existing?.wechat_qr || null);
      const qq_qr = qqQrFile ? `/uploads/${qqQrFile.filename}` : (existing?.qq_qr || null);
    
    // 处理about_images多文件上传
    let aboutImagesArray = [];
    
    // 如果前端传了about_images_paths字符串（包含用户选择的现有图片路径）
    if (about_images !== undefined && about_images !== null) {
      const trimmed = String(about_images).trim();
      if (trimmed === '' || trimmed === '[]') {
        // 如果前端明确传递了空数组或空字符串，表示要清空所有图片
        aboutImagesArray = [];
      } else {
        try {
          const parsed = JSON.parse(about_images);
          if (Array.isArray(parsed)) {
            aboutImagesArray = parsed; // 使用前端传来的数组（可能用户删除了某些图片）
          } else {
            // 如果不是数组，使用现有图片
            if (existing?.about_images) {
              try {
                aboutImagesArray = JSON.parse(existing.about_images);
              } catch (e2) {
                aboutImagesArray = [];
              }
            }
          }
        } catch (e) {
          console.error('解析about_images_paths失败:', e, '原始值:', about_images);
          // 如果解析失败，尝试使用现有图片
          if (existing?.about_images) {
            try {
              aboutImagesArray = JSON.parse(existing.about_images);
            } catch (e2) {
              aboutImagesArray = [];
            }
          } else {
            aboutImagesArray = [];
          }
        }
      }
    } else {
      // 如果没有传字符串，使用现有图片
      if (existing?.about_images) {
        try {
          aboutImagesArray = JSON.parse(existing.about_images);
        } catch (e) {
          aboutImagesArray = [];
        }
      }
    }
    
    // 如果有新上传的文件，添加到数组末尾
    if (aboutImagesFiles && aboutImagesFiles.length > 0) {
      const newImages = aboutImagesFiles.map(file => `/uploads/${file.filename}`);
      aboutImagesArray = [...aboutImagesArray, ...newImages];
      
      // 限制最多5张图片
      if (aboutImagesArray.length > 5) {
        aboutImagesArray = aboutImagesArray.slice(0, 5);
      }
    }
    
    const aboutImagesJson = JSON.stringify(aboutImagesArray);

      // 确保所有值都是有效的（将undefined转为null，但保留空字符串）
      const safeValue = (val) => {
        if (val === undefined) return null;
        if (val === null) return null;
        // 保留空字符串，因为用户可能想清空某些字段
        return val;
      };
      
      if (existing) {
        db.run(`UPDATE profile SET 
          avatar = ?, name = ?, main_title = ?, sub_title = ?, hero_description = ?, about_description = ?, 
          about_images = ?, skills = ?, wechat_qr = ?, qq_qr = ?, email = ?, address = ?
          WHERE id = ?`,
          [
            safeValue(avatar), 
            safeValue(name), 
            safeValue(main_title), 
            safeValue(sub_title), 
            safeValue(hero_description), 
            safeValue(about_description), 
            safeValue(aboutImagesJson), 
            safeValue(skills), 
            safeValue(wechat_qr), 
            safeValue(qq_qr), 
            safeValue(email), 
            safeValue(address), 
            existing.id
          ],
          (err) => {
            if (err) {
              console.error('更新profile失败:', err);
              console.error('SQL参数:', [
                safeValue(avatar), 
                safeValue(name), 
                safeValue(main_title), 
                safeValue(sub_title), 
                safeValue(hero_description), 
                safeValue(about_description), 
                safeValue(aboutImagesJson), 
                safeValue(skills), 
                safeValue(wechat_qr), 
                safeValue(qq_qr), 
                safeValue(email), 
                safeValue(address), 
                existing.id
              ]);
              return res.status(500).json({ error: '更新失败: ' + err.message });
            }
            console.log('更新成功，ID:', existing.id);
            // 返回更新后的数据
            db.get('SELECT * FROM profile WHERE id = ?', [existing.id], (err, updated) => {
              if (err) {
                console.error('获取更新后的数据失败:', err);
                return res.json({ message: '更新成功' });
              }
              res.json({ message: '更新成功', data: updated });
            });
          });
      } else {
        db.run(`INSERT INTO profile (avatar, name, main_title, sub_title, hero_description, about_description, about_images, skills, wechat_qr, qq_qr, email, address)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            safeValue(avatar), 
            safeValue(name), 
            safeValue(main_title), 
            safeValue(sub_title), 
            safeValue(hero_description), 
            safeValue(about_description), 
            safeValue(aboutImagesJson), 
            safeValue(skills), 
            safeValue(wechat_qr), 
            safeValue(qq_qr), 
            safeValue(email), 
            safeValue(address)
          ],
          (err) => {
            if (err) {
              console.error('创建profile失败:', err);
              console.error('SQL参数:', [avatar, name, main_title, sub_title, hero_description, about_description, aboutImagesJson, skills, wechat_qr, qq_qr, email, address]);
              return res.status(500).json({ error: '创建失败: ' + err.message });
            }
            res.json({ message: '创建成功' });
          });
      }
    });
  } catch (error) {
    console.error('处理请求时发生错误:', error);
    return res.status(500).json({ error: '服务器错误: ' + error.message });
  }
});

// 作品相关API
app.get('/api/works', (req, res) => {
  const { category } = req.query;
  let query = 'SELECT * FROM works';
  const params = [];

  if (category && category !== 'All') {
    query += ' WHERE category = ?';
    params.push(category);
  }

  query += ' ORDER BY sort_order ASC, created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    res.json(rows);
  });
});

// 获取单个作品详情
app.get('/api/works/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM works WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    if (!row) {
      return res.status(404).json({ error: '作品不存在' });
    }
    res.json(row);
  });
});

app.post('/api/works', authenticateToken, (req, res, next) => {
  // 使用 upload.any() 处理所有文件字段，文本字段会自动通过 req.body 访问
  upload.any()(req, res, (err) => {
    if (err) {
      // 如果是 LIMIT_UNEXPECTED_FILE 错误，在使用 upload.any() 时应该忽略
      if (err instanceof multer.MulterError && err.code === 'LIMIT_UNEXPECTED_FILE') {
        console.warn('忽略 LIMIT_UNEXPECTED_FILE 错误（使用 upload.any() 时）');
        return next();
      }
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, (req, res) => {
  try {
    const { name, description, category, images_paths, sort_order } = req.body;
    
    // 打印接收到的数据（用于调试）
    console.log('创建作品 - 接收到的数据:', {
      name,
      description,
      category,
      images_paths,
      sort_order,
      files: req.files ? req.files.map(f => ({ fieldname: f.fieldname, filename: f.filename })) : 'no files',
      bodyKeys: Object.keys(req.body),
      contentType: req.headers['content-type']
    });
    
    // 验证必填字段
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: '作品名称不能为空' });
    }
    
    // 处理单张图片（兼容旧数据）
    const files = req.files || [];
    const imageFile = files.find(f => f.fieldname === 'image');
    const image = imageFile ? `/uploads/${imageFile.filename}` : null;
    
    // 处理多图
    let imagesArray = [];
    if (images_paths !== undefined && images_paths !== null && images_paths !== '') {
      const trimmed = String(images_paths).trim();
      if (trimmed === '' || trimmed === '[]') {
        // 如果前端明确传递了空数组或空字符串，表示要清空所有图片
        imagesArray = [];
      } else {
        try {
          const parsed = JSON.parse(images_paths);
          if (Array.isArray(parsed)) {
            imagesArray = parsed;
          }
        } catch (e) {
          console.error('解析images_paths失败:', e, '原始值:', images_paths);
        }
      }
    }
    
    // 处理新上传的多图文件
    const imagesFiles = files.filter(f => f.fieldname === 'images');
    if (imagesFiles && imagesFiles.length > 0) {
      const newImages = imagesFiles.map(file => `/uploads/${file.filename}`);
      imagesArray = [...imagesArray, ...newImages];
    }
    
    const imagesJson = JSON.stringify(imagesArray);
    const sortOrder = sort_order !== undefined && sort_order !== null ? parseInt(sort_order) : 0;

    // 确保所有值都是有效的
    const safeValue = (val) => (val !== undefined && val !== null) ? val : null;
    const safeString = (val) => (val !== undefined && val !== null) ? String(val) : '';

    console.log('创建作品 - SQL参数:', [
      safeString(name),
      safeString(description),
      safeValue(image),
      safeString(imagesJson),
      safeString(category),
      sortOrder
    ]);

    db.run('INSERT INTO works (name, description, image, images, category, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [safeString(name), safeString(description), safeValue(image), safeString(imagesJson), safeString(category), sortOrder],
      function(err) {
        if (err) {
          console.error('创建作品失败:', err);
          console.error('SQL参数:', [name, description, image, imagesJson, category, sortOrder]);
          console.error('错误堆栈:', err.stack);
          return res.status(500).json({ error: '创建失败: ' + err.message });
        }
        console.log('创建作品成功:', this.lastID);
        res.json({ id: this.lastID, message: '创建成功' });
      });
  } catch (error) {
    console.error('处理创建作品请求时发生未捕获错误:', error);
    console.error('错误堆栈:', error.stack);
    return res.status(500).json({ error: '服务器内部错误: ' + error.message });
  }
});

app.put('/api/works/:id', authenticateToken, (req, res, next) => {
  // 使用 upload.any() 处理所有文件字段，文本字段会自动通过 req.body 访问
  upload.any()(req, res, (err) => {
    if (err) {
      // 如果是 LIMIT_UNEXPECTED_FILE 错误，在使用 upload.any() 时应该忽略
      if (err instanceof multer.MulterError && err.code === 'LIMIT_UNEXPECTED_FILE') {
        console.warn('忽略 LIMIT_UNEXPECTED_FILE 错误（使用 upload.any() 时）');
        return next();
      }
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, (req, res) => {
  try {
    const { name, description, category, images_paths, sort_order } = req.body;
    const id = req.params.id;

    // 打印接收到的数据（用于调试）
    console.log('更新作品 - 接收到的数据:', {
      id,
      name,
      description,
      category,
      images_paths,
      sort_order,
      files: req.files ? req.files.map(f => ({ fieldname: f.fieldname, filename: f.filename })) : 'no files',
      bodyKeys: Object.keys(req.body)
    });

    db.get('SELECT * FROM works WHERE id = ?', [id], (err, work) => {
      if (err) {
        console.error('查询作品失败:', err);
        return res.status(500).json({ error: '查询作品失败: ' + err.message });
      }
      if (!work) {
        return res.status(404).json({ error: '作品不存在' });
      }

      // 处理单张图片（兼容旧数据）
      const files = req.files || [];
      const imageFile = files.find(f => f.fieldname === 'image');
      const image = imageFile ? `/uploads/${imageFile.filename}` : (work.image || null);
      
      // 处理多图
      let imagesArray = [];
      if (images_paths !== undefined && images_paths !== null && images_paths !== '') {
        const trimmed = String(images_paths).trim();
        if (trimmed === '' || trimmed === '[]') {
          // 如果前端明确传递了空数组或空字符串，表示要清空所有图片
          imagesArray = [];
        } else {
          try {
            const parsed = JSON.parse(images_paths);
            if (Array.isArray(parsed)) {
              imagesArray = parsed;
            } else {
              // 如果不是数组，尝试使用现有图片
              if (work.images) {
                try {
                  imagesArray = JSON.parse(work.images);
                } catch (e2) {
                  imagesArray = [];
                }
              }
            }
          } catch (e) {
            console.error('解析images_paths失败:', e, '原始值:', images_paths);
            // 如果解析失败，尝试使用现有图片
            if (work.images) {
              try {
                imagesArray = JSON.parse(work.images);
              } catch (e2) {
                imagesArray = [];
              }
            }
          }
        }
      } else if (work.images) {
        // 如果没有传images_paths，使用现有图片
        try {
          imagesArray = JSON.parse(work.images);
        } catch (e) {
          imagesArray = [];
        }
      }
      
      // 处理新上传的多图文件
      const imagesFiles = files.filter(f => f.fieldname === 'images');
      if (imagesFiles && imagesFiles.length > 0) {
        const newImages = imagesFiles.map(file => `/uploads/${file.filename}`);
        imagesArray = [...imagesArray, ...newImages];
      }
      
      const imagesJson = JSON.stringify(imagesArray);
      const sortOrder = sort_order !== undefined && sort_order !== null ? parseInt(sort_order) : (work.sort_order || 0);

      // 确保所有值都是有效的
      const safeValue = (val) => (val !== undefined && val !== null) ? val : null;
      const safeString = (val) => (val !== undefined && val !== null) ? String(val) : '';

      console.log('更新作品 - SQL参数:', [
        safeString(name),
        safeString(description),
        safeValue(image),
        safeString(imagesJson),
        safeString(category),
        sortOrder,
        id
      ]);

      db.run('UPDATE works SET name = ?, description = ?, image = ?, images = ?, category = ?, sort_order = ? WHERE id = ?',
        [safeString(name), safeString(description), safeValue(image), safeString(imagesJson), safeString(category), sortOrder, id],
        (err) => {
          if (err) {
            console.error('更新作品失败:', err);
            console.error('SQL参数:', [name, description, image, imagesJson, category, sortOrder, id]);
            console.error('错误堆栈:', err.stack);
            return res.status(500).json({ error: '更新失败: ' + err.message });
          }
          console.log('更新作品成功:', id);
          res.json({ message: '更新成功' });
        });
    });
  } catch (error) {
    console.error('处理更新作品请求时发生未捕获错误:', error);
    console.error('错误堆栈:', error.stack);
    return res.status(500).json({ error: '服务器内部错误: ' + error.message });
  }
});

app.delete('/api/works/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM works WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: '删除失败' });
    }
    res.json({ message: '删除成功' });
  });
});

// 批量更新作品排序
app.put('/api/works/sort', authenticateToken, (req, res) => {
  const { items } = req.body; // items: [{id: 1, sort_order: 0}, {id: 2, sort_order: 1}, ...]
  
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: '无效的排序数据' });
  }

  const updatePromises = items.map(item => {
    return new Promise((resolve, reject) => {
      db.run('UPDATE works SET sort_order = ? WHERE id = ?', [item.sort_order, item.id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  Promise.all(updatePromises)
    .then(() => res.json({ message: '排序更新成功' }))
    .catch(err => res.status(500).json({ error: '排序更新失败: ' + err.message }));
});

// 思考沉淀相关API
app.get('/api/thoughts', (req, res) => {
  db.all('SELECT * FROM thoughts ORDER BY sort_order ASC, created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    res.json(rows);
  });
});

// 获取单个思考详情
app.get('/api/thoughts/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM thoughts WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    if (!row) {
      return res.status(404).json({ error: '思考不存在' });
    }
    res.json(row);
  });
});

app.post('/api/thoughts', authenticateToken, upload.any(), (req, res) => {
  try {
    const { title, content, images_paths, sort_order } = req.body;
    
    // 打印接收到的数据（用于调试）
    console.log('创建思考 - 接收到的数据:', {
      title,
      content,
      images_paths,
      sort_order,
      files: req.files ? req.files.map(f => ({ fieldname: f.fieldname, filename: f.filename })) : 'no files'
    });
    
    // 处理单张图片（兼容旧数据）
    const files = req.files || [];
    const imageFile = files.find(f => f.fieldname === 'image');
    const image = imageFile ? `/uploads/${imageFile.filename}` : null;
    
    // 处理多图
    let imagesArray = [];
    if (images_paths !== undefined && images_paths !== null && images_paths !== '') {
      const trimmed = String(images_paths).trim();
      if (trimmed === '' || trimmed === '[]') {
        // 如果前端明确传递了空数组或空字符串，表示要清空所有图片
        imagesArray = [];
      } else {
        try {
          const parsed = JSON.parse(images_paths);
          if (Array.isArray(parsed)) {
            imagesArray = parsed;
          }
        } catch (e) {
          console.error('解析images_paths失败:', e, '原始值:', images_paths);
        }
      }
    }
    
    // 处理新上传的多图文件
    const imagesFiles = files.filter(f => f.fieldname === 'images');
    if (imagesFiles && imagesFiles.length > 0) {
      const newImages = imagesFiles.map(file => `/uploads/${file.filename}`);
      imagesArray = [...imagesArray, ...newImages];
    }
    
    const imagesJson = JSON.stringify(imagesArray);
    const sortOrder = sort_order !== undefined && sort_order !== null ? parseInt(sort_order) : 0;

    // 确保所有值都是有效的
    const safeValue = (val) => (val !== undefined && val !== null) ? val : null;
    const safeString = (val) => (val !== undefined && val !== null) ? String(val) : '';

    console.log('创建思考 - SQL参数:', [
      safeString(title),
      safeString(content),
      safeValue(image),
      safeString(imagesJson),
      sortOrder
    ]);

    db.run('INSERT INTO thoughts (title, content, image, images, sort_order) VALUES (?, ?, ?, ?, ?)',
      [safeString(title), safeString(content), safeValue(image), safeString(imagesJson), sortOrder],
      function(err) {
        if (err) {
          console.error('创建思考失败:', err);
          console.error('SQL参数:', [title, content, image, imagesJson, sortOrder]);
          return res.status(500).json({ error: '创建失败: ' + err.message });
        }
        res.json({ id: this.lastID, message: '创建成功' });
      });
  } catch (error) {
    console.error('处理创建思考请求时发生未捕获错误:', error);
    return res.status(500).json({ error: '服务器内部错误: ' + error.message });
  }
});

app.put('/api/thoughts/:id', authenticateToken, upload.any(), (req, res) => {
  try {
    const { title, content, images_paths, sort_order } = req.body;
    const id = req.params.id;

    // 打印接收到的数据（用于调试）
    console.log('更新思考 - 接收到的数据:', {
      id,
      title,
      content,
      images_paths,
      sort_order,
      files: req.files ? req.files.map(f => ({ fieldname: f.fieldname, filename: f.filename })) : 'no files'
    });

    db.get('SELECT * FROM thoughts WHERE id = ?', [id], (err, thought) => {
      if (err) {
        console.error('查询思考失败:', err);
        return res.status(500).json({ error: '查询思考失败: ' + err.message });
      }
      if (!thought) {
        return res.status(404).json({ error: '思考不存在' });
      }

      // 处理单张图片（兼容旧数据）
      const files = req.files || [];
      const imageFile = files.find(f => f.fieldname === 'image');
      const image = imageFile ? `/uploads/${imageFile.filename}` : (thought.image || null);
      
      // 处理多图
      let imagesArray = [];
      if (images_paths !== undefined && images_paths !== null && images_paths !== '') {
        const trimmed = String(images_paths).trim();
        if (trimmed === '' || trimmed === '[]') {
          // 如果前端明确传递了空数组或空字符串，表示要清空所有图片
          imagesArray = [];
        } else {
          try {
            const parsed = JSON.parse(images_paths);
            if (Array.isArray(parsed)) {
              imagesArray = parsed;
            } else {
              // 如果不是数组，尝试使用现有图片
              if (thought.images) {
                try {
                  imagesArray = JSON.parse(thought.images);
                } catch (e2) {
                  imagesArray = [];
                }
              }
            }
          } catch (e) {
            console.error('解析images_paths失败:', e, '原始值:', images_paths);
            // 如果解析失败，尝试使用现有图片
            if (thought.images) {
              try {
                imagesArray = JSON.parse(thought.images);
              } catch (e2) {
                imagesArray = [];
              }
            }
          }
        }
      } else if (thought.images) {
        // 如果没有传images_paths，使用现有图片
        try {
          imagesArray = JSON.parse(thought.images);
        } catch (e) {
          imagesArray = [];
        }
      }
      
      // 处理新上传的多图文件
      const imagesFiles = files.filter(f => f.fieldname === 'images');
      if (imagesFiles && imagesFiles.length > 0) {
        const newImages = imagesFiles.map(file => `/uploads/${file.filename}`);
        imagesArray = [...imagesArray, ...newImages];
      }
      
      const imagesJson = JSON.stringify(imagesArray);
      const sortOrder = sort_order !== undefined && sort_order !== null ? parseInt(sort_order) : (thought.sort_order || 0);

      // 确保所有值都是有效的
      const safeValue = (val) => (val !== undefined && val !== null) ? val : null;
      const safeString = (val) => (val !== undefined && val !== null) ? String(val) : '';

      console.log('更新思考 - SQL参数:', [
        safeString(title),
        safeString(content),
        safeValue(image),
        safeString(imagesJson),
        sortOrder,
        id
      ]);

      db.run('UPDATE thoughts SET title = ?, content = ?, image = ?, images = ?, sort_order = ? WHERE id = ?',
        [safeString(title), safeString(content), safeValue(image), safeString(imagesJson), sortOrder, id],
        function(err) {
          if (err) {
            console.error('更新思考失败:', err);
            console.error('SQL参数:', [
              safeString(title),
              safeString(content),
              safeValue(image),
              safeString(imagesJson),
              sortOrder,
              id
            ]);
            return res.status(500).json({ error: '更新失败: ' + err.message });
          }
          res.json({ message: '更新成功' });
        });
    });
  } catch (error) {
    console.error('处理更新思考请求时发生未捕获错误:', error);
    console.error('错误堆栈:', error.stack);
    return res.status(500).json({ error: '服务器内部错误: ' + error.message });
  }
});

app.delete('/api/thoughts/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM thoughts WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: '删除失败' });
    }
    res.json({ message: '删除成功' });
  });
});

// 批量更新思考排序
app.put('/api/thoughts/sort', authenticateToken, (req, res) => {
  const { items } = req.body; // items: [{id: 1, sort_order: 0}, {id: 2, sort_order: 1}, ...]
  
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: '无效的排序数据' });
  }

  const updatePromises = items.map(item => {
    return new Promise((resolve, reject) => {
      db.run('UPDATE thoughts SET sort_order = ? WHERE id = ?', [item.sort_order, item.id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  Promise.all(updatePromises)
    .then(() => res.json({ message: '排序更新成功' }))
    .catch(err => res.status(500).json({ error: '排序更新失败: ' + err.message }));
});

// 图册相关API
app.get('/api/gallery', (req, res) => {
  db.all('SELECT * FROM gallery ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    res.json(rows);
  });
});

app.post('/api/gallery', authenticateToken, upload.single('image'), (req, res) => {
  const { name, description } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  db.run('INSERT INTO gallery (name, description, image) VALUES (?, ?, ?)',
    [name, description, image],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '创建失败' });
      }
      res.json({ id: this.lastID, message: '创建成功' });
    });
});

app.put('/api/gallery/:id', authenticateToken, upload.single('image'), (req, res) => {
  const { name, description } = req.body;
  const id = req.params.id;

  db.get('SELECT * FROM gallery WHERE id = ?', [id], (err, item) => {
    if (err || !item) {
      return res.status(404).json({ error: '图册不存在' });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : item.image;

    db.run('UPDATE gallery SET name = ?, description = ?, image = ? WHERE id = ?',
      [name, description, image, id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: '更新失败' });
        }
        res.json({ message: '更新成功' });
      });
  });
});

app.delete('/api/gallery/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM gallery WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: '删除失败' });
    }
    res.json({ message: '删除成功' });
  });
});

// 留言相关API
app.post('/api/messages', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: '请填写所有必填字段' });
  }

  // 简单的邮箱验证
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: '邮箱格式不正确' });
  }

  db.run('INSERT INTO messages (name, email, message) VALUES (?, ?, ?)',
    [name, email, message],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '提交失败' });
      }
      res.json({ id: this.lastID, message: '提交成功' });
    });
});

app.get('/api/messages', authenticateToken, (req, res) => {
  db.all('SELECT * FROM messages ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    res.json(rows);
  });
});

app.put('/api/messages/:id', authenticateToken, (req, res) => {
  const { status } = req.body;
  db.run('UPDATE messages SET status = ? WHERE id = ?', [status, req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: '更新失败' });
    }
    res.json({ message: '更新成功' });
  });
});

app.delete('/api/messages/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM messages WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: '删除失败' });
    }
    res.json({ message: '删除成功' });
  });
});

// 友情链接相关API
app.get('/api/links', (req, res) => {
  db.all('SELECT * FROM links ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    res.json(rows);
  });
});

app.post('/api/links', authenticateToken, (req, res) => {
  const { name, url } = req.body;
  db.run('INSERT INTO links (name, url) VALUES (?, ?)', [name, url],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '创建失败' });
      }
      res.json({ id: this.lastID, message: '创建成功' });
    });
});

app.put('/api/links/:id', authenticateToken, (req, res) => {
  const { name, url } = req.body;
  db.run('UPDATE links SET name = ?, url = ? WHERE id = ?', [name, url, req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: '更新失败' });
    }
    res.json({ message: '更新成功' });
  });
});

app.delete('/api/links/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM links WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: '删除失败' });
    }
    res.json({ message: '删除成功' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Connected to SQLite database');
});


