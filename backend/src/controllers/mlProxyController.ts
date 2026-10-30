import { Response } from 'express';
import axios from 'axios';
import { config } from '../config/env';
import { AuthenticatedRequest } from '../middleware/auth';

export const predictDuration = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const mlRes = await axios.post(`${config.mlServiceUrl}/predict-duration`, {
      ...req.body,
      user_id: req.user!.id
    }, { timeout: 4000 });
    res.json(mlRes.data);
  } catch (err: any) {
    // Fallback baseline heuristic
    const category = req.body.category || 'Work';
    const baselines: Record<string, number> = { Study: 60, Work: 90, Personal: 45, Health: 45, Other: 30 };
    const base = baselines[category] || 60;
    const est = req.body.user_estimated_minutes || base;
    res.json({
      predicted_minutes: est,
      baseline_minutes: base,
      confidence_lower: Math.max(15, Math.round(est * 0.8)),
      confidence_upper: Math.round(est * 1.25),
      prediction_source: 'baseline_fallback',
      model_version: 'baseline-v1',
      explanations: [`Category '${category}' baseline estimate: ${base} mins`]
    });
  }
};

export const analyzeWorkload = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const mlRes = await axios.post(`${config.mlServiceUrl}/analyze-workload`, req.body, { timeout: 4000 });
    res.json(mlRes.data);
  } catch (err: any) {
    res.status(502).json({ error: 'ML Workload analysis service unavailable. ' + err.message });
  }
};

export const optimizeSchedule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const mlRes = await axios.post(`${config.mlServiceUrl}/generate-schedule`, req.body, { timeout: 5000 });
    res.json(mlRes.data);
  } catch (err: any) {
    res.status(502).json({ error: 'ML Schedule optimizer service unavailable. ' + err.message });
  }
};

export const getModelStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const mlRes = await axios.get(`${config.mlServiceUrl}/model-info`, {
      params: { user_id: req.user!.id },
      timeout: 3000
    });
    res.json(mlRes.data);
  } catch (err: any) {
    res.json({
      status: 'offline',
      service: 'TimeWeave AI/ML Service (Fallback active)',
      model_loaded: false,
      error: err.message
    });
  }
};
