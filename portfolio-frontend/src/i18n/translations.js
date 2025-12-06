// 翻译文件
export const translations = {
  zh: {
    // 导航栏
    nav: {
      home: '首页',
      aboutMe: '关于我',
      blog: '作品',
      reviews: '思考',
      contact: '联系'
    },
    // 首页
    home: {
      greeting: '你好，我是',
      moreDetails: '了解更多',
      aboutMe: '关于我',
      myLatestWorks: '我的最新作品',
      blog: '思考与沉淀',
      contactMe: '联系我',
      letsTalk: '让我们聊聊！',
      tellMeAboutIdea: '在这里告诉我你的想法',
      name: '姓名',
      email: '邮箱',
      message: '留言',
      sendMessages: '发送消息',
      namePlaceholder: '请输入您的姓名',
      emailPlaceholder: '请输入您的邮箱',
      messagePlaceholder: '请留下您的联系方式和留言，我会尽快回复您。',
      fillAllFields: '请填写所有必填字段',
      invalidEmail: '邮箱格式不正确',
      submitSuccess: '留言提交成功！',
      submitFailed: '提交失败，请稍后重试',
      views: '次浏览',
      skills: '技能：',
      all: '全部',
      noWorks: '暂无作品'
    },
    // 作品页
    works: {
      title: '我的作品',
      noWorks: '暂无作品'
    },
    // 思考页
    thoughts: {
      title: '思考沉淀',
      noThoughts: '暂无思考内容'
    },
    // 联系页
    contact: {
      title: '联系我',
      letsTalk: '让我们聊聊！',
      tellMeAboutIdea: '在这里告诉我你的想法',
      name: '姓名',
      email: '邮箱',
      message: '留言',
      sendMessages: '发送消息',
      namePlaceholder: '请输入您的姓名',
      emailPlaceholder: '请输入您的邮箱',
      messagePlaceholder: '请留下您的联系方式和留言，我会尽快回复您。',
      fillAllFields: '请填写所有必填字段',
      invalidEmail: '邮箱格式不正确',
      submitSuccess: '留言提交成功！',
      submitFailed: '提交失败，请稍后重试'
    },
    // 页脚
    footer: {
      quickLinks: '快速链接',
      home: '首页',
      aboutMe: '关于我',
      work: '作品',
      thoughts: '思考',
      contactMe: '联系我',
      scanToAdd: '扫码添加',
      followMe: '关注我',
      copyright: '版权所有 © 2025. Xure 保留所有权利'
    },
    // 分类
    categories: {
      all: '全部',
      trading: '交易类',
      live: '直播类',
      game: '游戏类',
      tool: '工具类',
      system: '系统类'
    },
    // 图册页
    gallery: {
      title: '图册',
      noGallery: '暂无图册内容'
    },
    // 作品详情页
    workDetail: {
      loading: '加载中...',
      notFound: '作品不存在',
      noImages: '暂无图片'
    },
    // 思考详情页
    thoughtDetail: {
      loading: '加载中...',
      notFound: '思考不存在',
      noImages: '暂无图片'
    }
  },
  en: {
    // 导航栏
    nav: {
      home: 'HOME',
      aboutMe: 'ABOUT ME',
      blog: 'WORK',
      reviews: 'REVIEWS',
      contact: 'CONTACT'
    },
    // 首页
    home: {
      greeting: "Hi, I'm",
      moreDetails: 'MORE DETAILS',
      aboutMe: 'About Me',
      myLatestWorks: 'My latest works',
      blog: 'Thoughts & Insights',
      contactMe: 'Contact me',
      letsTalk: "Let's Talk!",
      tellMeAboutIdea: 'Tell me about your idea here',
      name: 'Name',
      email: 'Email',
      message: 'Message',
      sendMessages: 'Send Messages',
      namePlaceholder: 'Your name',
      emailPlaceholder: 'contact@email.com',
      messagePlaceholder: 'Leave your contact details and message, and I\'ll get back to you ASAP.',
      fillAllFields: 'Please fill in all required fields',
      invalidEmail: 'Invalid email format',
      submitSuccess: 'Message submitted successfully!',
      submitFailed: 'Submission failed, please try again later',
      views: 'K views',
      skills: 'Skills:',
      all: 'All',
      noWorks: 'No works available'
    },
    // 作品页
    works: {
      title: 'My Works',
      noWorks: 'No works available'
    },
    // 思考页
    thoughts: {
      title: 'Thoughts',
      noThoughts: 'No thoughts available'
    },
    // 联系页
    contact: {
      title: 'Contact Me',
      letsTalk: "Let's Talk!",
      tellMeAboutIdea: 'Tell me about your idea here',
      name: 'Name',
      email: 'Email',
      message: 'Message',
      sendMessages: 'Send Messages',
      namePlaceholder: 'Your name',
      emailPlaceholder: 'contact@email.com',
      messagePlaceholder: 'Leave your contact details and message, and I\'ll get back to you ASAP.',
      fillAllFields: 'Please fill in all required fields',
      invalidEmail: 'Invalid email format',
      submitSuccess: 'Message submitted successfully!',
      submitFailed: 'Submission failed, please try again later'
    },
    // 页脚
    footer: {
      quickLinks: 'Quick links',
      home: 'Home',
      aboutMe: 'About me',
      work: 'Work',
      thoughts: 'Thoughts',
      contactMe: 'Contact me',
      scanToAdd: 'SCAN to ADD',
      followMe: 'FOLLOW ME',
      copyright: 'Copyright © 2025. All Right Reserved by Xure'
    },
    // 分类
    categories: {
      all: 'All',
      trading: 'Trading',
      live: 'Live Streaming',
      game: 'Game',
      tool: 'Tool',
      system: 'System'
    },
    // 图册页
    gallery: {
      title: 'Gallery',
      noGallery: 'No gallery items available'
    },
    // 作品详情页
    workDetail: {
      loading: 'Loading...',
      notFound: 'Work not found',
      noImages: 'No images available'
    },
    // 思考详情页
    thoughtDetail: {
      loading: 'Loading...',
      notFound: 'Thought not found',
      noImages: 'No images available'
    }
  }
};

// 检测浏览器语言
export const detectLanguage = () => {
  const browserLang = navigator.language || navigator.userLanguage;
  // 如果浏览器语言是中文（包括 zh-CN, zh-TW, zh-HK 等），返回 'zh'，否则返回 'en'
  if (browserLang.startsWith('zh')) {
    return 'zh';
  }
  return 'en';
};

