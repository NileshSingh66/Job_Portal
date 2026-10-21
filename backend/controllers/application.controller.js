import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";

// Apply for a job
export const applyJob = async (req, res) => {
    try {
        const userId = req.id;
        const jobId = req.params.id;

        if (!jobId) {
            return res.status(400).json({
                message: "Job id is required",
                success: false
            });
        }

        // Check if user has already applied
        const existingApplication = await Application.findOne({
            job: jobId,
            applicant: userId
        });

        if (existingApplication) {
            return res.status(400).json({
                message: "You have already applied for this job",
                success: false
            });
        }

        // Check if the job exists
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            });
        }

        // Create a new application
        const newApplication = await Application.create({
            job: jobId,
            applicant: userId
        });

        // FIXED: Use findByIdAndUpdate + $push to avoid "Job validation failed" on whole-document save
        await Job.findByIdAndUpdate(
            jobId,
            { $push: { applications: newApplication._id } },
            { new: true }
        );

        return res.status(201).json({
            message: "Job applied successfully",
            success: true
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Something went wrong",
            success: false
        });
    }
};

// Get jobs applied by the logged-in user
export const getAppliedJobs = async (req, res) => {
    try {
        const userId = req.id;

        const application = await Application.find({
            applicant: userId
        })
            .sort({ createdAt: -1 })
            .populate({
                path: "job",
                options: { sort: { createdAt: -1 } },
                populate: {
                    path: "company",
                    options: { sort: { createdAt: -1 } }
                }
            });

        if (!application || application.length === 0) {
            return res.status(404).json({
                message: "No application",
                success: false
            });
        }

        return res.status(200).json({
            application,
            success: true
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Something went wrong",
            success: false
        });
    }
};

// Admin sees how many users applied for a job
export const getApplicants = async (req, res) => {
    try {
        const jobId = req.params.id;

        const job = await Job.findById(jobId).populate({
            path: "applications",
            options: { sort: { createdAt: -1 } },
            populate: {
                path: "applicant",
                select: "-password"
            }
        });

        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            });
        }

        return res.status(200).json({
            job,
            success: true
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Something went wrong",
            success: false
        });
    }
};

// Update application status
export const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const applicationId = req.params.id;

        if (!status) {
            return res.status(400).json({
                message: "Status is required",
                success: false
            });
        }

        // Find application
        const application = await Application.findOne({
            _id: applicationId
        });

        if (!application) {
            return res.status(404).json({
                message: "Application not found",
                success: false
            });
        }

        // Update status
        application.status = status;
        await application.save();

        return res.status(200).json({
            message: "Status updated successfully",
            success: true
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Something went wrong",
            success: false
        });
    }
};