import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import SkeletonLoader from './SkeletonLoader';
import { patterns, validationMessages, sanitizeInput } from '../utils/validation';
import './UserManagement.css';

const UserManagement = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Search & filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');      // 'all' | 'mechanic' | 'receptionist'
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'disabled'

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'mechanic',
        phone: ''
    });

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

    const getAxiosConfig = () => {
        const token = localStorage.getItem('ACCESS_TOKEN');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${apiBaseUrl}/supervisor/staff`, getAxiosConfig());
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(t('supervisor.users.fetch_error', 'Failed to load staff list. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    // ── Derived filtered list ──────────────────────────────────────────────
    const filteredUsers = users.filter(user => {
        const term = searchTerm.trim().toLowerCase();
        const matchesSearch =
            !term ||
            user.name?.toLowerCase().includes(term) ||
            user.email?.toLowerCase().includes(term) ||
            user.role?.toLowerCase().includes(term);

        const matchesRole =
            roleFilter === 'all' || user.role === roleFilter;

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && user.is_active) ||
            (statusFilter === 'disabled' && !user.is_active);

        return matchesSearch && matchesRole && matchesStatus;
    });

    // ── Handlers ──────────────────────────────────────────────────────────
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        let newValue = value;
        if (name === 'name') {
            newValue = sanitizeInput('name', value);
        } else if (name === 'phone') {
            newValue = sanitizeInput('phone', value);
        }

        setFormData(prev => ({ ...prev, [name]: newValue }));
    };

    const openAddModal = () => {
        setModalMode('add');
        setFormData({ name: '', email: '', password: '', role: 'mechanic', phone: '' });
        setSelectedUser(null);
        setShowModal(true);
    };

    const openEditModal = (user) => {
        setModalMode('edit');
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            phone: user.phone || ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Frontend Validation
        if (!patterns.name.test(formData.name)) {
            setError(validationMessages.name);
            return;
        }
        if (formData.phone && !patterns.phone.test(formData.phone)) {
            setError(validationMessages.phone);
            return;
        }
        if (formData.password && !patterns.password.test(formData.password)) {
            setError(validationMessages.password);
            return;
        }

        try {
            if (modalMode === 'add') {
                await axios.post(`${apiBaseUrl}/supervisor/staff`, formData, getAxiosConfig());
            } else {
                const updateData = { ...formData };
                if (!updateData.password) delete updateData.password;
                await axios.put(`${apiBaseUrl}/supervisor/staff/${selectedUser.id}`, updateData, getAxiosConfig());
            }
            closeModal();
            fetchUsers();
        } catch (err) {
            console.error('Error saving user:', err);
            setError(err.response?.data?.message || t('supervisor.users.save_error', 'Failed to save staff member.'));
        }
    };

    const toggleStatus = async (userId) => {
        try {
            await axios.patch(`${apiBaseUrl}/supervisor/staff/${userId}/toggle-status`, {}, getAxiosConfig());
            fetchUsers();
        } catch (err) {
            console.error('Error toggling status:', err);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="user-management-system">
            {/* Header row */}
            <div className="um-header">
                <h2>{t('supervisor.users.staff_directory', 'Staff Directory')}</h2>
                <button className="add-btn" onClick={openAddModal}>{t('supervisor.users.add_new_staff', '+ Add New Staff')}</button>
            </div>

            {/* Filters row */}
            <div className="um-filters">
                <div className="search-wrapper">
                    <i className="ri-search-line search-icon" />
                    <input
                        type="text"
                        className="filter-input search-input"
                        placeholder={t('supervisor.users.search_placeholder', 'Search by name, email or role...')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="clear-search" onClick={() => setSearchTerm('')}>&times;</button>
                    )}
                </div>

                <select
                    className="filter-select"
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                >
                    <option value="all">{t('supervisor.users.all_roles', 'All Roles')}</option>
                    <option value="mechanic">{t('roles.mechanic', 'Mechanic')}</option>
                    <option value="receptionist">{t('roles.receptionist', 'Receptionist')}</option>
                </select>

                <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                    <option value="all">{t('supervisor.users.all_status', 'All Status')}</option>
                    <option value="active">{t('supervisor.users.active', 'Active')}</option>
                    <option value="disabled">{t('supervisor.users.disabled', 'Disabled')}</option>
                </select>
            </div>

            {/* Error banner (outside modal) */}
            {error && !showModal && <div className="error-alert">{error}</div>}

            {/* Table or Skeleton */}
            <div className="table-container">
                {loading ? (
                    <SkeletonLoader type="table-rows" count={6} cols={6} />
                ) : (
                    <table className="staff-table">
                        <thead>
                            <tr>
                                <th>{t('supervisor.users.name', 'Name')}</th>
                                <th>{t('supervisor.users.email', 'Email')}</th>
                                <th>{t('supervisor.users.phone', 'Phone')}</th>
                                <th>{t('supervisor.users.role', 'Role')}</th>
                                <th>{t('supervisor.users.status', 'Status')}</th>
                                <th>{t('supervisor.users.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center">
                                        {t('supervisor.users.no_staff_found', 'No staff members match your filters.')}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className={!user.is_active ? 'disabled-row' : ''}>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>{user.phone || <span style={{ color: 'var(--text-muted,#999)' }}>—</span>}</td>
                                        <td>
                                            <span className={`role-badge ${user.role}`}>
                                                {t(`roles.${user.role}`, user.role)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${user.is_active ? 'active' : 'disabled'}`}>
                                                {user.is_active ? t('supervisor.users.active', 'Active') : t('supervisor.users.disabled', 'Disabled')}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            <button className="edit-btn" onClick={() => openEditModal(user)}>{t('supervisor.users.edit', 'Edit')}</button>
                                            <button
                                                className={`toggle-btn ${user.is_active ? 'disable' : 'enable'}`}
                                                onClick={() => toggleStatus(user.id)}
                                            >
                                                {user.is_active ? t('supervisor.users.disable', 'Disable') : t('supervisor.users.enable', 'Enable')}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Result count */}
            {!loading && (
                <p className="results-count">
                    {t('supervisor.users.showing_x_of_y', 'Showing {{count}} of {{total}} staff members', { count: filteredUsers.length, total: users.length })}
                </p>
            )}

            {/* MODAL */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header-sup">
                            <h3>{modalMode === 'add' ? t('supervisor.users.create_new_staff', 'Create New Staff') : t('supervisor.users.edit_staff_member', 'Edit Staff Member')}</h3>
                            <button className="close-x" onClick={closeModal}>&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="staff-form">
                            {error && <div className="error-alert">{error}</div>}

                            <div className="form-group">
                                <label>{t('supervisor.users.name', 'Name')}</label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                            </div>

                            <div className="form-group">
                                <label>{t('supervisor.users.email', 'Email')}</label>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                            </div>

                            <div className="form-group">
                                <label>{t('supervisor.users.phone', 'Phone')}</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} />
                            </div>

                            {modalMode === 'add' && (
                                <div className="form-group">
                                    <label>{t('supervisor.users.role', 'Role')}</label>
                                    <select name="role" value={formData.role} onChange={handleInputChange}>
                                        <option value="mechanic">{t('roles.mechanic', 'Mechanic')}</option>
                                        <option value="receptionist">{t('roles.receptionist', 'Receptionist')}</option>
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label>{t('supervisor.users.password', 'Password')} {modalMode === 'edit' && <span className="hint">{t('supervisor.users.leave_blank', '(Leave blank to keep current)')}</span>}</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required={modalMode === 'add'}
                                    minLength={6}
                                />
                            </div>

                            <div className="modal-footer-sup">
                                <button type="button" className="cancel-btn" onClick={closeModal}>{t('supervisor.users.cancel_btn', 'Cancel')}</button>
                                <button type="submit" className="save-btn">
                                    {modalMode === 'add' ? t('supervisor.users.create_btn', 'Create Staff') : t('supervisor.users.save_btn', 'Save Changes')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
