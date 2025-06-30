import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './ProfilePicture.css';

const ProfilePicture = ({ src }) => {
  const { user } = useContext(AuthContext);
  return (
    <div className="profile-picture">
      <img src={src || user?.profile_picture || '/default-profile.png'} alt="Profile" />
    </div>
  );
};

export default ProfilePicture;
