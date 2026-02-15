export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size: number;
  webViewLink: string;
  iconLink: string;
  isFolder: boolean;
  isGoogleDoc: boolean;
  folder?: string;
  section?: string;
}

export interface DriveResponse {
  configured: boolean;
  files: DriveFile[];
  error?: string;
}

export interface DriveGroup {
  label: string;
  files: DriveFile[];
  error?: string;
}

export interface DriveMultiResponse {
  configured: boolean;
  groups: DriveGroup[];
}
