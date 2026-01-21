import * as adminService from '../services/adminService.js';

// ==================== MEMBERS TABLE CRUD ====================

export const getAllMembers = async (req, res, next) => {
  try {
    const members = await adminService.getAllMembers();
    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    next(error);
  }
};

export const getMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const member = await adminService.getMemberById(id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    res.status(200).json({
      success: true,
      data: member
    });
  } catch (error) {
    next(error);
  }
};

export const createMember = async (req, res, next) => {
  try {
    const member = await adminService.createMember(req.body);
    res.status(201).json({
      success: true,
      data: member
    });
  } catch (error) {
    next(error);
  }
};

export const updateMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const member = await adminService.updateMember(id, req.body);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    res.status(200).json({
      success: true,
      data: member
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await adminService.deleteMember(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Member deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== HOSPITALS TABLE CRUD ====================

export const getAllHospitals = async (req, res, next) => {
  try {
    const hospitals = await adminService.getAllHospitals();
    res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals
    });
  } catch (error) {
    next(error);
  }
};

export const getHospitalById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hospital = await adminService.getHospitalById(id);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    res.status(200).json({
      success: true,
      data: hospital
    });
  } catch (error) {
    next(error);
  }
};

export const createHospital = async (req, res, next) => {
  try {
    const hospital = await adminService.createHospital(req.body);
    res.status(201).json({
      success: true,
      data: hospital
    });
  } catch (error) {
    next(error);
  }
};

export const updateHospital = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hospital = await adminService.updateHospital(id, req.body);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    res.status(200).json({
      success: true,
      data: hospital
    });
  } catch (error) {
    next(error);
  }
};

export const deleteHospital = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await adminService.deleteHospital(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Hospital deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ELECTED MEMBERS TABLE CRUD ====================

export const getAllElectedMembers = async (req, res, next) => {
  try {
    const electedMembers = await adminService.getAllElectedMembers();
    res.status(200).json({
      success: true,
      count: electedMembers.length,
      data: electedMembers
    });
  } catch (error) {
    next(error);
  }
};

export const getElectedMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const electedMember = await adminService.getElectedMemberById(id);
    if (!electedMember) {
      return res.status(404).json({
        success: false,
        message: 'Elected member not found'
      });
    }
    res.status(200).json({
      success: true,
      data: electedMember
    });
  } catch (error) {
    next(error);
  }
};

export const createElectedMember = async (req, res, next) => {
  try {
    const electedMember = await adminService.createElectedMember(req.body);
    res.status(201).json({
      success: true,
      data: electedMember
    });
  } catch (error) {
    next(error);
  }
};

export const updateElectedMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const electedMember = await adminService.updateElectedMember(id, req.body);
    if (!electedMember) {
      return res.status(404).json({
        success: false,
        message: 'Elected member not found'
      });
    }
    res.status(200).json({
      success: true,
      data: electedMember
    });
  } catch (error) {
    next(error);
  }
};

export const deleteElectedMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await adminService.deleteElectedMember(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Elected member not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Elected member deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== COMMITTEE MEMBERS TABLE CRUD ====================

export const getAllCommitteeMembers = async (req, res, next) => {
  try {
    const committeeMembers = await adminService.getAllCommitteeMembers();
    res.status(200).json({
      success: true,
      count: committeeMembers.length,
      data: committeeMembers
    });
  } catch (error) {
    next(error);
  }
};

export const getCommitteeMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const committeeMember = await adminService.getCommitteeMemberById(id);
    if (!committeeMember) {
      return res.status(404).json({
        success: false,
        message: 'Committee member not found'
      });
    }
    res.status(200).json({
      success: true,
      data: committeeMember
    });
  } catch (error) {
    next(error);
  }
};

export const createCommitteeMember = async (req, res, next) => {
  try {
    const committeeMember = await adminService.createCommitteeMember(req.body);
    res.status(201).json({
      success: true,
      data: committeeMember
    });
  } catch (error) {
    next(error);
  }
};

export const updateCommitteeMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const committeeMember = await adminService.updateCommitteeMember(id, req.body);
    if (!committeeMember) {
      return res.status(404).json({
        success: false,
        message: 'Committee member not found'
      });
    }
    res.status(200).json({
      success: true,
      data: committeeMember
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCommitteeMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await adminService.deleteCommitteeMember(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Committee member not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Committee member deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DOCTORS (OPD_SCHEDULE) TABLE CRUD ====================

export const getAllDoctors = async (req, res, next) => {
  try {
    const doctors = await adminService.getAllDoctors();
    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doctor = await adminService.getDoctorById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    next(error);
  }
};

export const createDoctor = async (req, res, next) => {
  try {
    const doctor = await adminService.createDoctor(req.body);
    res.status(201).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    next(error);
  }
};

export const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doctor = await adminService.updateDoctor(id, req.body);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await adminService.deleteDoctor(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Doctor deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== APPOINTMENTS TABLE CRUD ====================

export const getAllAppointments = async (req, res, next) => {
  try {
    const appointments = await adminService.getAllAppointments();
    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

export const getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await adminService.getAppointmentById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (req, res, next) => {
  try {
    const appointment = await adminService.createAppointment(req.body);
    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

export const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await adminService.updateAppointment(id, req.body);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await adminService.deleteAppointment(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== REFERRALS TABLE CRUD ====================

export const getAllReferrals = async (req, res, next) => {
  try {
    const referrals = await adminService.getAllReferrals();
    res.status(200).json({
      success: true,
      count: referrals.length,
      data: referrals
    });
  } catch (error) {
    next(error);
  }
};

export const getReferralById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const referral = await adminService.getReferralById(id);
    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }
    res.status(200).json({
      success: true,
      data: referral
    });
  } catch (error) {
    next(error);
  }
};

export const updateReferral = async (req, res, next) => {
  try {
    const { id } = req.params;
    const referral = await adminService.updateReferral(id, req.body);
    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }
    res.status(200).json({
      success: true,
      data: referral
    });
  } catch (error) {
    next(error);
  }
};

export const createReferral = async (req, res, next) => {
  try {
    const referral = await adminService.createReferral(req.body);
    res.status(201).json({
      success: true,
      data: referral
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReferral = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await adminService.deleteReferral(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Referral deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SPONSORS TABLE CRUD ====================

export const getAllSponsors = async (req, res, next) => {
  try {
    // Check if this is a public route (not admin route)
    // Public route: /api/sponsors, Admin route: /api/admin/sponsors
    const isAdminRoute = req.originalUrl.includes('/api/admin/sponsors');
    // For public routes, only show active sponsors; admin can see all
    const onlyActive = !isAdminRoute;
    
    const sponsors = await adminService.getAllSponsors(onlyActive);
    res.status(200).json({
      success: true,
      count: sponsors.length,
      data: sponsors
    });
  } catch (error) {
    console.error('Error in getAllSponsors controller:', error);
    next(error);
  }
};

export const getSponsorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sponsor = await adminService.getSponsorById(id);
    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor not found'
      });
    }
    res.status(200).json({
      success: true,
      data: sponsor
    });
  } catch (error) {
    next(error);
  }
};

export const createSponsor = async (req, res, next) => {
  try {
    const sponsor = await adminService.createSponsor(req.body);
    res.status(201).json({
      success: true,
      data: sponsor
    });
  } catch (error) {
    next(error);
  }
};

export const updateSponsor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sponsor = await adminService.updateSponsor(id, req.body);
    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor not found'
      });
    }
    res.status(200).json({
      success: true,
      data: sponsor
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSponsor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await adminService.deleteSponsor(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Sponsor deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
