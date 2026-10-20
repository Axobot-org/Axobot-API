export interface CrowdinProject {
  id: string;
  userId: string;
  sourceLanguageId: string;
  targetLanguageIds: string[];
  identifier: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  lastActivity: Date;
  description: string;
  url: string;
  cname: null;
  languageAccessPolicy: string;
  visibility: string;
  publicDownloads: boolean;
}

export interface CrowdinFile {
  id: string;
  name: string;
  title: string;
  type: string;
  path: string;
  status: string;
  revision: string;
  branchId: string;
  directoryId: string;
  project: Project;
}

export interface CrowdinUser {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
}

export interface CrowdinString {
  id: string;
  identifier: string;
  key: string;
  text: string;
  type: string;
  context: string;
  maxLength: string;
  isHidden: boolean;
  isDuplicate: boolean;
  masterStringId: string;
  revision: string;
  hasPlurals: boolean;
  labelIds: int[];
  url: string;
  createdAt: Date;
  updatedAt: Date;
  file: CrowdinFile;
  project: Project;
}
