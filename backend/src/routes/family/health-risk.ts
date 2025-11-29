import { Router, Request, Response } from 'express';
import { authenticateToken, requireFamily } from '../../middleware/auth';
import { 
  calculateHealthRiskScore, 
  calculateMedicationCompliance,
  analyzeBloodPressureTrend
} from '../../services/healthRiskService';

const router = Router();

// GET /api/family/health-risk/:elderId - คำนวณคะแนนความเสี่ยง
router.get('/:elderId', authenticateToken, requireFamily, async (req: Request, res: Response) => {
  try {
    const { elderId } = req.params;
    
    const riskScore = await calculateHealthRiskScore(elderId);
    
    res.json(riskScore);
  } catch (error: any) {
    console.error('Calculate health risk error:', error);
    res.status(500).json({ error: 'Failed to calculate health risk', message: error.message });
  }
});

// GET /api/family/health-risk/:elderId/compliance - คำนวณ Medication Compliance
router.get('/:elderId/compliance', authenticateToken, requireFamily, async (req: Request, res: Response) => {
  try {
    const { elderId } = req.params;
    const { days = 7 } = req.query;
    
    const compliance = await calculateMedicationCompliance(elderId, Number(days));
    
    res.json({ compliance, days: Number(days) });
  } catch (error: any) {
    console.error('Calculate compliance error:', error);
    res.status(500).json({ error: 'Failed to calculate compliance', message: error.message });
  }
});

// GET /api/family/health-risk/:elderId/bp-trend - วิเคราะห์แนวโน้มความดัน
router.get('/:elderId/bp-trend', authenticateToken, requireFamily, async (req: Request, res: Response) => {
  try {
    const { elderId } = req.params;
    const { days = 30 } = req.query;
    
    const trend = await analyzeBloodPressureTrend(elderId, Number(days));
    
    res.json(trend);
  } catch (error: any) {
    console.error('Analyze BP trend error:', error);
    res.status(500).json({ error: 'Failed to analyze blood pressure trend', message: error.message });
  }
});

export default router;
