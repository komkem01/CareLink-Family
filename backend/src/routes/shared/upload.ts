import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/upload/image - อัพโหลดรูปภาพ
router.post('/image', async (req: Request, res: Response) => {
  try {
    // TODO: Implement with Cloudinary or S3
    res.json({ message: 'Image upload - TODO: Implement with Cloudinary' });
  } catch (error: any) {
    console.error('Upload image error:', error);
    res.status(500).json({ error: 'Failed to upload image', message: error.message });
  }
});

// POST /api/upload/document - อัพโหลดเอกสาร
router.post('/document', async (req: Request, res: Response) => {
  try {
    // TODO: Implement with Cloudinary or S3
    res.json({ message: 'Document upload - TODO: Implement with Cloudinary' });
  } catch (error: any) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Failed to upload document', message: error.message });
  }
});

export default router;
