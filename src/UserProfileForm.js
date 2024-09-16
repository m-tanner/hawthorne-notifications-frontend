import React, {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';

const UserProfileForm = () => {
    const {id} = useParams();
    const [formData, setFormData] = useState({
        preferred_name: '',
        email_address: '',
        favorite_keywords: [],
        favorites_only: false,
        unsubscribed: false,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [actionResponse, setActionResponse] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            const response = await fetch(`/api/user/${id}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Login token not found');
                }
                throw new Error('Failed to fetch user data');
            }
            const data = await response.json();
            setFormData(data);
            setLoading(false);
        };

        fetchUserData().catch((error) => {
            setError(error.message);
            setLoading(false);
        });
    }, [id]);

    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        if (type === 'checkbox') {
            setFormData((prevData) => ({
                ...prevData,
                [name]: checked,
            }));
        } else if (name === 'favorite_keywords') {
            setFormData((prevData) => ({
                ...prevData,
                [name]: value.split(',')
            }));
        } else {
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }));
        }
    };

    const submitUserData = async (id, formData) => {
        const response = await fetch(`/api/user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                secret: id,
                user: {
                    ...formData,
                    favorite_keywords: formData.favorite_keywords.map((keyword) => keyword.trim())
                }
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to submit data');
        }

        return response.json();
    };

    const handleFormSubmission = async () => {
        try {
            const data = await submitUserData(id, formData);
            console.log('Form Data Submitted:', data);
            setSubmitted(true)
        } catch (error) {
            setError(error.message)
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleFormSubmission().catch((error) => {
            setError(error.message);
        });
    };


    const triggerNotificationsApi = async (id) => {
        if (id === '') {
            throw new Error('id cannot be empty when triggering notifications');
        }
        console.log(id)

        const response = await fetch(`/api/trigger`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                secret: id
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to trigger notifications');
        }

        return result;
    };

    const handleTriggerNotifications = async () => {
        try {
            const result = await triggerNotificationsApi(id);
            setActionResponse({success: true, message: result.message});
        } catch (error) {
            setActionResponse({success: false, message: error.message});
        }
    };

    const triggerNotifications = () => {
        handleTriggerNotifications().catch((error) => {
            setActionResponse({success: false, message: error.message});
        });
    };

    if (loading) {
        return (
            <div className={"user-profile-form-container"}>
                <p>Loading...</p>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className={"user-profile-form-container"}>
                <p>
                    Your profile has been updated!
                    Log in again to make more changes.
                </p>
                <p>
                    <a href="https://hawthornestereo.news">Return to Login</a>
                </p>
            </div>
        );
    }

    if (error === 'Login token not found') {
        return (
            <div className={"user-profile-form-container"}>
                <p>This login token is used or expired. Please log in again.</p>
                <p>
                    <a href="https://hawthornestereo.news">Return to Login</a>
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={"user-profile-form-container"}>
                <p>Unexpected Error: {error}</p>
            </div>
        );
    }

    return (
        <div className={"user-profile-form-container"}>
            <h2>Hawthorne Stereo Wish List</h2>
            <h3>Edit your preferences</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="preferred_name">Your Name:</label>
                    <input
                        type="text"
                        id="preferred_name"
                        name="preferred_name"
                        value={formData.preferred_name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email_address">Email Address:</label>
                    <input
                        type="email"
                        id="email_address"
                        name="email_address"
                        value={formData.email_address}
                        onChange={handleChange}
                        required
                        readOnly={true}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="favorite_keywords">Your Wish List (comma-separated):</label>
                    <input
                        type="text"
                        id="favorite_keywords"
                        name="favorite_keywords"
                        placeholder="e.g. Luxman,SX-850,chrome bumper,equalizer"
                        value={Array.isArray(formData.favorite_keywords) ? formData.favorite_keywords.join(',') : ''}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group checkbox-group">
                    <label htmlFor="favorites_only">Only notify about Wish List entries?</label>
                    <input
                        type="checkbox"
                        id="favorites_only"
                        name="favorites_only"
                        checked={formData.favorites_only}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group checkbox-group">
                    <label htmlFor="unsubscribed">Unsubscribe?</label>
                    <input
                        type="checkbox"
                        id="unsubscribed"
                        name="unsubscribed"
                        checked={formData.unsubscribed}
                        onChange={handleChange}
                    />
                </div>
                <button type="submit">Save</button>
            </form>
            {/* Conditionally render the "Trigger Notifications" button */}
            {(typeof formData.email_address === 'string' &&
                    (formData.email_address.endsWith('@hawthornestereo.com') ||
                        formData.email_address.endsWith('@tanner-wei.com')))
                && (
                    <button className="trigger-button" onClick={triggerNotifications}>
                        <img src="/rocket.png" alt="Rocket Icon"/>
                        Trigger Notifications
                    </button>
                )}
            {actionResponse && (
                <p>
                    {actionResponse.success ? (
                        <span>Success: {actionResponse.message}</span>
                    ) : (
                        <span>Error: {actionResponse.message}</span>
                    )}
                </p>
            )}
            {error && <p>Error: {error}</p>}
        </div>
    );
};

export default UserProfileForm;
