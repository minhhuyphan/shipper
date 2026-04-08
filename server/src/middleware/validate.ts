/**
 * Data Validation Middleware
 * Chức năng: Sử dụng Zod để kiểm tra tính hợp lệ của dữ liệu đầu vào (body, query, params).
 */
import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    console.log(
      "📥 Validating request body:",
      JSON.stringify(req.body, null, 2),
    );
    const result = schema.safeParse(req.body);
    if (!result.success) {
      console.error("❌ Validation error:", result.error.errors);
      res.status(400).json({
        error: "Validation failed",
        details: result.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
      return;
    }
    console.log("✅ Validation passed");
    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        error: "Query validation failed",
        details: result.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
      return;
    }
    req.query = result.data;
    next();
  };
};
