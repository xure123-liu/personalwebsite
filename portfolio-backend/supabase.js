const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 未设置，将无法使用 Supabase');
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * 上传文件到 Supabase Storage，返回公开访问的 URL
 * @param {Buffer} buffer - 文件内容
 * @param {string} filename - 文件名（可含扩展名）
 * @param {string} mimetype - MIME 类型
 * @returns {Promise<string|null>} 公开 URL 或 null
 */
async function uploadToStorage(buffer, filename, mimetype) {
  if (!supabase) return null;
  const ext = filename.includes('.') ? filename.replace(/^.*\./, '') : 'jpg';
  const path = `files/${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(path, buffer, {
      contentType: mimetype || 'image/jpeg',
      upsert: false
    });
  if (error) {
    console.error('Supabase Storage 上传失败:', error);
    return null;
  }
  const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
  return urlData.publicUrl;
}

module.exports = { supabase, uploadToStorage };
