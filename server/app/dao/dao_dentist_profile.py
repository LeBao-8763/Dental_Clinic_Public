from app import db
from app.models import DentistProfile, User

def create_dentist_profile(dentist_id, introduction=None, education=None, experience=None):

    if User.query.get(dentist_id) is None:
        raise ValueError("Bác sĩ với ID đã cho không tồn tại") 
    
    dentist_profile = DentistProfile(
        dentist_id=dentist_id,
        introduction=introduction,
        education=education,
        experience=experience
    )
    db.session.add(dentist_profile)
    db.session.commit()
    return dentist_profile

def get_dentist_profile_by_dentist_id(dentist_id):
    return DentistProfile.query.filter_by(dentist_id=dentist_id).first()

def update_dentist_profile(dentist_id, introduction=None, education=None, experience=None):
    profile = DentistProfile.query.filter_by(dentist_id=dentist_id).first()
    if not profile:
        return None
    if introduction: profile.introduction = introduction
    if education: profile.education = education
    if experience: profile.experience = experience
    db.session.commit()
    return profile

def delete_dentist_profile(dentist_id):
    profile = DentistProfile.query.filter_by(dentist_id=dentist_id).first()
    if not profile:
        return False
    db.session.delete(profile)
    db.session.commit()
    return True