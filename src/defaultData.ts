import { PlatformData, PlatformSettings } from './types';

export const initialPlatformData: PlatformData = {
  "sections": [
    {
      "id": "sec-1",
      "title": "القسم الأول",
      "description": "وصف",
      "iconName": "BookOpen",
      "order": 1,
      "createdAt": "2026-09-24T00:00:00.000Z"
    }
  ],
  "resources": [],
  "videos": [],
  "files": [],
  "quizzes": [],
  "liveStream": {
    "isEnabled": false,
    "title": "البث المباشر - منصة التميز التعليمية",
    "streamUrl": "",
    "description": "",
    "scheduledTime": "",
    "updatedAt": "2026-09-16T09:02:32.747Z"
  },
  "settings": {
    "theme": {
      "id": "emerald",
      "preset": "emerald",
      "name": "الزمردي الأكاديمي الكلاسيكي",
      "primaryColor": "emerald",
      "borderRadius": "xl",
      "density": "normal",
      "headerStyle": "standard",
      "fontScale": "base",
      "cardStyle": "bordered",
      "sectionsLayout": "grid-3",
      "layoutPreset": "sidebar-split-right",
      "customLayoutOrder": {
        "desktop": [
          "sections",
          "resources",
          "video-stage"
        ],
        "mobile": [
          "sections",
          "resources",
          "video-stage"
        ]
      }
    },
    "announcement": {
      "isEnabled": false,
      "message": "مرحباً بكم في منصة التميز التعليمية",
      "type": "info",
      "linkText": "",
      "linkUrl": "",
      "isDismissible": true,
      "updatedAt": "2026-09-22T07:21:17.767Z"
    },
    "access": {
      "isLocked": false,
      "lockReason": "maintenance",
      "lockMessage": "نحن حالياً في فترة صيانة وتحديثات للمنصة لتجهيز أفضل تجربة تعليمية لكم. سنعود للعمل قريباً!",
      "subscriptionMessage": "انتهى اشتراكك أو تواصل مع المشرف لتفعيل الاشتراك أو اشترك الآن للوصول لكافة المحتويات.",
      "whatsappNumber": "",
      "whatsappMessage": "السلام عليكم يا أستاذ، أريد تفعيل اشتراكي في منصة التميز التعليمية",
      "telegramUsername": "",
      "subscriptionButtonText": "اشترك الآن أو فعّل اشتراكك عبر واتساب",
      "allowedStudentEmails": [],
      "updatedAt": "2026-09-24T06:54:28.949Z"
    }
  },
  "deletedIds": [
    "res-1788645931006",
    "vid-1788685980533",
    "file-1788646035246",
    "file-1788686146883",
    "quiz-1788686005901",
    "vid-1788842498895",
    "vid-1788842825351"
  ],
  "updatedAt": "2026-09-24T07:34:46.427Z"
};

export const defaultPlatformSettings: PlatformSettings = {
  "theme": {
    "id": "emerald",
    "preset": "emerald",
    "name": "الزمردي الأكاديمي الكلاسيكي",
    "primaryColor": "emerald",
    "borderRadius": "xl",
    "density": "normal",
    "headerStyle": "standard",
    "fontScale": "base",
    "cardStyle": "bordered",
    "sectionsLayout": "grid-3",
    "layoutPreset": "sidebar-split-right",
    "customLayoutOrder": {
      "desktop": [
        "sections",
        "resources",
        "video-stage"
      ],
      "mobile": [
        "sections",
        "resources",
        "video-stage"
      ]
    }
  },
  "announcement": {
    "isEnabled": false,
    "message": "مرحباً بكم في منصة التميز التعليمية",
    "type": "info",
    "linkText": "",
    "linkUrl": "",
    "isDismissible": true,
    "updatedAt": "2026-09-22T07:21:17.767Z"
  },
  "access": {
    "isLocked": false,
    "lockReason": "maintenance",
    "lockMessage": "نحن حالياً في فترة صيانة وتحديثات للمنصة لتجهيز أفضل تجربة تعليمية لكم. سنعود للعمل قريباً!",
    "subscriptionMessage": "انتهى اشتراكك أو تواصل مع المشرف لتفعيل الاشتراك أو اشترك الآن للوصول لكافة المحتويات.",
    "whatsappNumber": "",
    "whatsappMessage": "السلام عليكم يا أستاذ، أريد تفعيل اشتراكي في منصة التميز التعليمية",
    "telegramUsername": "",
    "subscriptionButtonText": "اشترك الآن أو فعّل اشتراكك عبر واتساب",
    "allowedStudentEmails": [],
    "updatedAt": "2026-09-24T06:54:28.949Z"
  }
};
