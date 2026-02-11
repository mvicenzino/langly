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
}

export interface DriveResponse {
  configured: boolean;
  files: DriveFile[];
  error?: string;
}
