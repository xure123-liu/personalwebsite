# 批量替换图片 URL 说明

由于文件较多，需要手动替换以下文件中的 `http://localhost:3002`：

## 需要替换的文件：

1. `portfolio-frontend/src/pages/Works.jsx`
2. `portfolio-frontend/src/pages/Thoughts.jsx`
3. `portfolio-frontend/src/pages/Gallery.jsx`
4. `portfolio-frontend/src/pages/Contact.jsx`
5. `portfolio-frontend/src/pages/WorkDetail.jsx`
6. `portfolio-frontend/src/pages/ThoughtDetail.jsx`
7. `portfolio-frontend/src/components/Footer.jsx`
8. `portfolio-frontend/src/pages/admin/ProfileManage.jsx`
9. `portfolio-frontend/src/pages/admin/WorksManage.jsx`
10. `portfolio-frontend/src/pages/admin/ThoughtsManage.jsx`
11. `portfolio-frontend/src/pages/admin/GalleryManage.jsx`

## 替换方法：

在每个文件顶部添加：
```javascript
import { getImageUrl } from '../utils/config';
```

然后将所有的：
```javascript
`http://localhost:3002${path}`
```

替换为：
```javascript
getImageUrl(path)
```

## 示例：

**替换前：**
```javascript
<img src={`http://localhost:3002${profile.avatar}`} alt="Avatar" />
```

**替换后：**
```javascript
import { getImageUrl } from '../utils/config';
// ...
<img src={getImageUrl(profile.avatar)} alt="Avatar" />
```

