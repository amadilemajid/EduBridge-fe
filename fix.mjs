import fs from 'fs';

function fixProfile() {
  const file = 'src/merchant-portal/pages/Profile.jsx';
  let text = fs.readFileSync(file, 'utf8');

  const oldStr = `  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    if (e.target.files?.length > 0) {
      alert("Documents securely received! Our compliance team will review them within 24-48 hours.");
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/api/v1/merchant/profile');
        const data = res?.data?.data || res?.data || res;
        setProfile(data);
      } catch (err) {
        setError(err.message || 'Failed to load shop profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);`;

  const newStr = `  const fetcher = url => apiClient.get(url).then(res => res?.data?.data || res?.data || res);
  const { data: profile, error: profError, isLoading: profLoading } = useSWR('/api/v1/merchant/profile', fetcher);
  const loading = profLoading && !profile;
  const error = profError?.message || null;
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    if (e.target.files?.length > 0) {
      alert("Documents securely received! Our compliance team will review them within 24-48 hours.");
    }
  };`;

  if(text.includes('const [profile, setProfile]')) {
    text = text.replace("import React, { useEffect, useState, useRef } from 'react';", "import React, { useRef } from 'react';\nimport useSWR from 'swr';");
    text = text.replace(oldStr, newStr);
    fs.writeFileSync(file, text);
    console.log('Fixed Profile');
  } else {
    console.log('Profile already fixed or block not found');
  }
}

fixProfile();
