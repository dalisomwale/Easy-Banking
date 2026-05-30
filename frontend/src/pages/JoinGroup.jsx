import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { FiHash, FiLogIn } from 'react-icons/fi';

const JoinGroup = () => {
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!code.trim()) return toast.error('Enter join code');
        setLoading(true);
        try {
            const res = await api.post('/groups/join', { code: code.toUpperCase() });
            toast.success('Joined group successfully!');
            navigate('/group-select');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="join-group-page">
            <div className="join-group-card">
                <h1>Join Group</h1>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="join-code">Enter Group Code</label>
                    <div className="input-group">
                        <FiHash />
                        <input
                            id="join-code"
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Group code"
                            disabled={loading}
                        />
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Joining...' : <><FiLogIn /> Join</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default JoinGroup;