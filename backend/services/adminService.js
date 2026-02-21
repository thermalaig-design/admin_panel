import { supabase, supabaseAdmin } from '../config/supabase.js';

// ==================== MEMBERS TABLE CRUD ====================

export const getAllMembers = async () => {
  try {
    let allData = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      let { data, error } = await supabase
        .from('Members Table')
        .select('*')
        .order('Name', { ascending: true })
        .range(from, from + batchSize - 1);

      if (error && error.code === 'PGRST116') {
        const result = await supabase
          .from('members_table')
          .select('*')
          .order('Name', { ascending: true })
          .range(from, from + batchSize - 1);
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < batchSize) {
          hasMore = false;
        } else {
          from += batchSize;
        }
      } else {
        hasMore = false;
      }
    }

    return allData;
  } catch (error) {
    console.error('Error fetching all members:', error);
    throw error;
  }
};

export const getMemberById = async (id) => {
  try {
    // Try with "Members Table" first
    let { data, error } = await supabase
      .from('Members Table')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      const result = await supabase
        .from('members_table')
        .select('*')
        .eq('id', id)
        .single();
      data = result.data;
      error = result.error;
    }

    // If not found by id, try by "S. No."
    if (!data || error) {
      const result2 = await supabase
        .from('Members Table')
        .select('*')
        .eq('"S. No."', id)
        .single();
      
      if (result2.error && result2.error.code === 'PGRST116') {
        // Try fallback table
        const result3 = await supabase
          .from('members_table')
          .select('*')
          .eq('"S. No."', id)
          .single();
        if (!result3.error) {
          data = result3.data;
          error = null;
        }
      } else if (!result2.error) {
        data = result2.data;
        error = null;
      }
    }

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching member by ID:', error);
    throw error;
  }
};

export const createMember = async (memberData) => {
  try {
    // Remove S. No. from user-provided data to prevent conflicts
    const { 'S. No.': _SNo, ...cleanMemberData } = memberData;
    
    // Generate next S. No.
    let { data: maxData, error: maxError } = await supabase
      .from('Members Table')
      .select('"S. No."')
      .order('"S. No."', { ascending: false })
      .limit(1);

    if (maxError && maxError.code === 'PGRST116') {
      const result = await supabase
        .from('members_table')
        .select('"S. No."')
        .order('"S. No."', { ascending: false })
        .limit(1);
      maxData = result.data;
      maxError = result.error;
    }

    if (maxError) throw maxError;

    const nextSNo = maxData && maxData.length > 0 ? maxData[0]['S. No.'] + 1 : 1;
    cleanMemberData['S. No.'] = nextSNo;

    let { data, error } = await supabase
      .from('Members Table')
      .insert([cleanMemberData])
      .select()
      .single();

    if (error && error.code === 'PGRST116') {
      const result = await supabase
        .from('members_table')
        .insert([cleanMemberData])
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating member:', error);
    throw error;
  }
};

export const updateMember = async (id, memberData) => {
  try {
    // Remove S. No. from user-provided data to prevent conflicts
    const { 'S. No.': _SNo, ...cleanMemberData } = memberData;
    
    // Try updating by id first
    let { data, error } = await supabase
      .from('Members Table')
      .update(cleanMemberData)
      .eq('id', id)
      .select()
      .single();

    if (error && error.code === 'PGRST116') {
      const result = await supabase
        .from('members_table')
        .update(cleanMemberData)
        .eq('id', id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    // If not found by id, try by "S. No."
    if (!data || error) {
      const result2 = await supabase
        .from('Members Table')
        .update(cleanMemberData)
        .eq('"S. No."', id)
        .select()
        .single();
      
      if (result2.error && result2.error.code === 'PGRST116') {
        // Try fallback table
        const result3 = await supabase
          .from('members_table')
          .update(cleanMemberData)
          .eq('"S. No."', id)
          .select()
          .single();
        if (!result3.error) {
          data = result3.data;
          error = null;
        }
      } else if (!result2.error) {
        data = result2.data;
        error = null;
      }
    }

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error updating member:', error);
    throw error;
  }
};

export const deleteMember = async (id) => {
  try {
    // Try deleting by id first
    let { error } = await supabase
      .from('Members Table')
      .delete()
      .eq('id', id);

    if (error && error.code === 'PGRST116') {
      const result = await supabase
        .from('members_table')
        .delete()
        .eq('id', id);
      error = result.error;
      if (!error) return true;
    }

    // If not found by id, try by "S. No."
    if (error) {
      const result2 = await supabase
        .from('Members Table')
        .delete()
        .eq('"S. No."', id);
      
      if (result2.error && result2.error.code === 'PGRST116') {
        // Try fallback table
        const result3 = await supabase
          .from('members_table')
          .delete()
          .eq('"S. No."', id);
        if (!result3.error) return true;
      } else if (!result2.error) {
        return true;
      }
    }

    if (error && error.code !== 'PGRST116') throw error;
    return true;
  } catch (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
};

// ==================== HOSPITALS TABLE CRUD ====================

export const getAllHospitals = async () => {
  try {
    let allData = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .order('hospital_name', { ascending: true })
        .range(from, from + batchSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < batchSize) {
          hasMore = false;
        } else {
          from += batchSize;
        }
      } else {
        hasMore = false;
      }
    }

    return allData;
  } catch (error) {
    console.error('Error fetching all hospitals:', error);
    throw error;
  }
};

export const getHospitalById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('hospitals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching hospital by ID:', error);
    throw error;
  }
};

export const createHospital = async (hospitalData) => {
  try {
    const { id: _id, ...cleanHospitalData } = hospitalData || {};
    const { data, error } = await supabaseAdmin
      .from('hospitals')
      .insert([cleanHospitalData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating hospital:', error);
    if (error && error.message) console.error('Message:', error.message);
    if (error && error.code) console.error('Code:', error.code);
    if (error && error.details) console.error('Details:', error.details);
    throw error;
  }
};

export const updateHospital = async (id, hospitalData) => {
  try {
    const { id: _id, ...cleanHospitalData } = hospitalData || {};
    const { data, error } = await supabaseAdmin
      .from('hospitals')
      .update(cleanHospitalData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating hospital:', error);
    if (error && error.message) console.error('Message:', error.message);
    if (error && error.code) console.error('Code:', error.code);
    if (error && error.details) console.error('Details:', error.details);
    throw error;
  }
};

export const deleteHospital = async (id) => {
  try {
    const { error } = await supabaseAdmin
      .from('hospitals')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting hospital:', error);
    if (error && error.message) console.error('Message:', error.message);
    if (error && error.code) console.error('Code:', error.code);
    if (error && error.details) console.error('Details:', error.details);
    throw error;
  }
};

// ==================== ELECTED MEMBERS TABLE CRUD ====================

export const getAllElectedMembers = async () => {
  try {
    let allData = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('elected_members')
        .select('*')
        .order('id', { ascending: true })
        .range(from, from + batchSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < batchSize) {
          hasMore = false;
        } else {
          from += batchSize;
        }
      } else {
        hasMore = false;
      }
    }

    return allData;
  } catch (error) {
    console.error('Error fetching all elected members:', error);
    throw error;
  }
};

export const getElectedMemberById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('elected_members')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching elected member by ID:', error);
    throw error;
  }
};

export const createElectedMember = async (electedData) => {
  try {
    const { data, error } = await supabase
      .from('elected_members')
      .insert([electedData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating elected member:', error);
    throw error;
  }
};

export const updateElectedMember = async (id, electedData) => {
  try {
    const { data, error } = await supabase
      .from('elected_members')
      .update(electedData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating elected member:', error);
    throw error;
  }
};

export const deleteElectedMember = async (id) => {
  try {
    const { error } = await supabase
      .from('elected_members')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting elected member:', error);
    throw error;
  }
};

// ==================== COMMITTEE MEMBERS TABLE CRUD ====================

export const getAllCommitteeMembers = async () => {
  try {
    let allData = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('committee_members')
        .select('*')
        .order('id', { ascending: true })
        .range(from, from + batchSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < batchSize) {
          hasMore = false;
        } else {
          from += batchSize;
        }
      } else {
        hasMore = false;
      }
    }

    return allData;
  } catch (error) {
    console.error('Error fetching all committee members:', error);
    throw error;
  }
};

export const getCommitteeMemberById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('committee_members')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching committee member by ID:', error);
    throw error;
  }
};

export const createCommitteeMember = async (committeeData) => {
  try {
    const { data, error } = await supabase
      .from('committee_members')
      .insert([committeeData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating committee member:', error);
    throw error;
  }
};

export const updateCommitteeMember = async (id, committeeData) => {
  try {
    const { data, error } = await supabase
      .from('committee_members')
      .update(committeeData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating committee member:', error);
    throw error;
  }
};

export const deleteCommitteeMember = async (id) => {
  try {
    const { error } = await supabase
      .from('committee_members')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting committee member:', error);
    throw error;
  }
};

// ==================== DOCTORS (OPD_SCHEDULE) TABLE CRUD ====================

export const getAllDoctors = async () => {
  try {
    let allData = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('opd_schedule')
        .select('*')
        .order('consultant_name', { ascending: true })
        .range(from, from + batchSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < batchSize) {
          hasMore = false;
        } else {
          from += batchSize;
        }
      } else {
        hasMore = false;
      }
    }

    return allData;
  } catch (error) {
    console.error('Error fetching all doctors:', error);
    throw error;
  }
};

export const getDoctorById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('opd_schedule')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching doctor by ID:', error);
    throw error;
  }
};

export const createDoctor = async (doctorData) => {
  try {
    const { id: _id, doctor_id: _doctor_id, 'S. No.': _sno, ...rawData } = doctorData || {};
    const cleanDoctorData = { ...rawData };

    // Retry loop: if Supabase returns PGRST204 for unknown column, remove it and retry
    const maxRetries = 5;
    let attempt = 0;
    while (true) {
      attempt++;
      const { data, error } = await supabaseAdmin
        .from('opd_schedule')
        .insert([cleanDoctorData])
        .select()
        .single();

      if (!error) return data;

      // If unknown column error, remove that column from payload and retry
      if (error.code === 'PGRST204' && error.message) {
        const m = error.message.match(/Could not find the '(.+?)' column/i) || [];
        const columnName = m[1];
        if (columnName && Object.prototype.hasOwnProperty.call(cleanDoctorData, columnName)) {
          delete cleanDoctorData[columnName];
          if (attempt >= maxRetries) break;
          continue;
        }
      }

      // Otherwise throw
      throw error;
    }
  } catch (error) {
    console.error('Error creating doctor:', error);
    if (error && error.message) console.error('Message:', error.message);
    if (error && error.code) console.error('Code:', error.code);
    if (error && error.details) console.error('Details:', error.details);
    throw error;
  }
};

export const updateDoctor = async (id, doctorData) => {
  try {
    const { id: _id, doctor_id: _doctor_id, 'S. No.': _sno, ...rawData } = doctorData || {};
    const cleanDoctorData = { ...rawData };

    // Retry loop: if Supabase returns PGRST204 for unknown column, remove it and retry
    const maxRetries = 5;
    let attempt = 0;
    while (true) {
      attempt++;
      const { data, error } = await supabaseAdmin
        .from('opd_schedule')
        .update(cleanDoctorData)
        .eq('id', id)
        .select()
        .single();

      if (!error) return data;

      if (error.code === 'PGRST204' && error.message) {
        const m = error.message.match(/Could not find the '(.+?)' column/i) || [];
        const columnName = m[1];
        if (columnName && Object.prototype.hasOwnProperty.call(cleanDoctorData, columnName)) {
          delete cleanDoctorData[columnName];
          if (attempt >= maxRetries) break;
          continue;
        }
      }

      // Otherwise throw
      throw error;
    }
  } catch (error) {
    console.error('Error updating doctor:', error);
    if (error && error.message) console.error('Message:', error.message);
    if (error && error.code) console.error('Code:', error.code);
    if (error && error.details) console.error('Details:', error.details);
    throw error;
  }
};

export const deleteDoctor = async (id) => {
  try {
    const { error } = await supabaseAdmin
      .from('opd_schedule')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting doctor:', error);
    if (error && error.message) console.error('Message:', error.message);
    if (error && error.code) console.error('Code:', error.code);
    if (error && error.details) console.error('Details:', error.details);
    throw error;
  }
};

// ==================== APPOINTMENTS TABLE CRUD ====================

export const getAllAppointments = async () => {
  try {
    let allData = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + batchSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < batchSize) {
          hasMore = false;
        } else {
          from += batchSize;
        }
      } else {
        hasMore = false;
      }
    }

    return allData;
  } catch (error) {
    console.error('Error fetching all appointments:', error);
    throw error;
  }
};

export const getAppointmentById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching appointment by ID:', error);
    throw error;
  }
};

export const createAppointment = async (appointmentData) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
};

export const updateAppointment = async (id, appointmentData) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update(appointmentData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};

export const deleteAppointment = async (id) => {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw error;
  }
};

// ==================== REFERRALS TABLE CRUD ====================

export const getAllReferrals = async () => {
  try {
    let allData = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: referrals, error: referralsError } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + batchSize - 1);

      if (referralsError) throw referralsError;

      if (referrals && referrals.length > 0) {
        const userPhones = [...new Set(referrals.map(r => r.user_phone))].filter(phone => phone);
        
        let memberInfoMap = {};
        if (userPhones.length > 0) {
          const { data: members, error: membersError } = await supabase
            .from('Members Table')
            .select('"Membership number", "Mobile", type');
            
          if (!membersError && members) {
            memberInfoMap = members.reduce((acc, member) => {
              if (member.Mobile) {
                const cleanPhone = member.Mobile.replace(/\D/g, '').slice(-10);
                acc[cleanPhone] = {
                  membership_number: member['Membership number'],
                  membership_type: member.type
                };
              }
              return acc;
            }, {});
          }
        }
        
        const referralsWithMembers = referrals.map(referral => {
          const cleanUserPhone = referral.user_phone ? referral.user_phone.replace(/\D/g, '').slice(-10) : '';
          const memberInfo = memberInfoMap[cleanUserPhone] || {};
          return {
            ...referral,
            membership_number: memberInfo.membership_number,
            membership_type: memberInfo.membership_type
          };
        });
        
        allData = [...allData, ...referralsWithMembers];
        
        if (referrals.length < batchSize) {
          hasMore = false;
        } else {
          from += batchSize;
        }
      } else {
        hasMore = false;
      }
    }

    return allData;
  } catch (error) {
    console.error('Error fetching all referrals:', error);
    throw error;
  }
};

export const getReferralById = async (id) => {
  try {
    const { data: referral, error } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    if (referral && referral.user_phone) {
      const cleanUserPhone = referral.user_phone.replace(/\D/g, '').slice(-10);
      const { data: members, error: memberError } = await supabase
        .from('Members Table')
        .select('"Membership number", "Mobile", type');
        
      if (!memberError && members) {
        const member = members.find(m => {
          if (m.Mobile) {
            const cleanMobile = m.Mobile.replace(/\D/g, '').slice(-10);
            return cleanMobile === cleanUserPhone;
          }
          return false;
        });
        
        if (member) {
          referral.membership_number = member['Membership number'];
          referral.membership_type = member.type;
        }
      }
    }
    
    return referral;
  } catch (error) {
    console.error('Error fetching referral by ID:', error);
    throw error;
  }
};

export const updateReferral = async (id, referralData) => {
  try {
    console.log('=== UPDATE REFERRAL SERVICE ===');
    console.log('ID:', id);
    console.log('Referral Data:', referralData);
    
    const { data: updatedReferral, error } = await supabaseAdmin
      .from('referrals')
      .update(referralData)
      .eq('id', id)
      .select()
      .single();

    console.log('Supabase response:', { data: updatedReferral, error });
    
    if (error) throw error;
    
    if (updatedReferral && updatedReferral.user_phone) {
      const cleanUserPhone = updatedReferral.user_phone.replace(/\D/g, '').slice(-10);
      try {
        // Try to find membership details
        let members = null;
        let memberError = null;
        
        // First try with 'Members Table' (with space)
        const { data: membersData1, error: error1 } = await supabase
          .from('Members Table')
          .select('"Membership number", "Mobile", type');
        
        if (!error1 && membersData1) {
          members = membersData1;
        } else {
          // If that fails, try with 'members_table' (snake_case)
          const { data: membersData2, error: error2 } = await supabase
            .from('members_table')
            .select('membership_number, mobile, type');
          
          if (!error2 && membersData2) {
            members = membersData2;
          } else {
            // If both fail, try with 'members' (simple name)
            const { data: membersData3, error: error3 } = await supabase
              .from('members')
              .select('membership_number, mobile, type');
            
            if (!error3 && membersData3) {
              members = membersData3;
            }
          }
        }
        
        if (members) {
          const member = members.find(m => {
            const mobileValue = m['Mobile'] || m.mobile || m['membership_number'];
            if (mobileValue) {
              const cleanMobile = mobileValue.replace(/\D/g, '').slice(-10);
              return cleanMobile === cleanUserPhone;
            }
            return false;
          });
          
          if (member) {
            updatedReferral.membership_number = member['Membership number'] || member.membership_number;
            updatedReferral.membership_type = member.type;
          }
        }
      } catch (lookupError) {
        // If membership lookup fails, continue anyway
        console.warn('Warning: Could not lookup membership details:', lookupError.message);
      }
    }
    
    return updatedReferral;
  } catch (error) {
    console.error('Error updating referral:', error);
    throw error;
  }
};

export const createReferral = async (referralData) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('referrals')
      .insert([referralData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating referral:', error);
    throw error;
  }
};

export const deleteReferral = async (id) => {
  try {
    const { error } = await supabaseAdmin
      .from('referrals')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting referral:', error);
    throw error;
  }
};

// ==================== SPONSORS TABLE CRUD ====================

export const getAllSponsors = async (onlyActive = false) => {
  try {
    let query = supabase
      .from('sponsors')
      .select('*');
    
    // Filter active sponsors only for public display
    if (onlyActive) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query
      .order('priority', { ascending: false });

    if (error) throw error;
    
    // Ensure positions field is properly handled as an array
    if (data) {
      return data.map(sponsor => ({
        ...sponsor,
        positions: Array.isArray(sponsor.positions) ? sponsor.positions : 
                 typeof sponsor.positions === 'string' ? sponsor.positions.split(',').map(p => p.trim()).filter(p => p) : []
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching all sponsors:', error);
    throw error;
  }
};

export const getSponsorById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    // Ensure positions field is properly handled as an array
    if (data) {
      return {
        ...data,
        positions: Array.isArray(data.positions) ? data.positions : 
                 typeof data.positions === 'string' ? data.positions.split(',').map(p => p.trim()).filter(p => p) : []
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching sponsor by ID:', error);
    throw error;
  }
};

export const createSponsor = async (sponsorData) => {
  try {
    // Handle positions array conversion for Supabase
    const processedSponsorData = { ...sponsorData };
    if (Array.isArray(sponsorData.positions)) {
      processedSponsorData.positions = sponsorData.positions;
    } else if (typeof sponsorData.positions === 'string') {
      // Convert string to array if needed
      processedSponsorData.positions = sponsorData.positions.split(',').map(p => p.trim()).filter(p => p);
    }
    
    const { data, error } = await supabase
      .from('sponsors')
      .insert([{
        ...processedSponsorData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: sponsorData.created_by || 'system'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating sponsor:', error);
    throw error;
  }
};

export const updateSponsor = async (id, sponsorData) => {
  try {
    // Handle positions array conversion for Supabase
    const processedSponsorData = { ...sponsorData };
    if (Array.isArray(sponsorData.positions)) {
      processedSponsorData.positions = sponsorData.positions;
    } else if (typeof sponsorData.positions === 'string') {
      // Convert string to array if needed
      processedSponsorData.positions = sponsorData.positions.split(',').map(p => p.trim()).filter(p => p);
    }
    
    const { data, error } = await supabase
      .from('sponsors')
      .update({
        ...processedSponsorData,
        updated_at: new Date().toISOString(),
        updated_by: sponsorData.updated_by || 'system'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating sponsor:', error);
    throw error;
  }
};

export const deleteSponsor = async (id) => {
  try {
    const { error } = await supabase
      .from('sponsors')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting sponsor:', error);
    throw error;
  }
};
