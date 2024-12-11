import { Request, Response, NextFunction } from "express";
import HttpStatusCode from "../Enums/httpStatusCodes";
import Company from "../Models/companyModel";

const companyAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("companyAuth triggered");
    console.log(req.headers);
    
    const company_id = req.headers["company_id"];
    console.log("company_id ",company_id);

    if (company_id) {
      const company = await Company.findOne({ company_id: company_id });
      // console.log(company);

      if (company?.isBlocked === true) {
        res.status(HttpStatusCode.FORBIDDEN).json("company blocked");
        return;
      }
    }
    next();
  } catch (error) {
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json("server error");
  }
};

export default companyAuth;
