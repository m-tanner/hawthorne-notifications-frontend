import React, {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';

const UserProfileForm = () => {
    const {id} = useParams();
    const [formData, setFormData] = useState({
        preferred_name: '',
        email_address: '',
        favorite_keywords: [],
        favorites_only: false,
        unsubscribe: false,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [triggerResponse, setTriggerResponse] = useState(null); // State to hold trigger response

    useEffect(() => {
        // Fetch user data from the API when the component mounts
        const fetchUserData = async (userId) => {
            const response = await fetch(`/api/user/${userId}`);
            if (!response.ok) {
                throw new Error("Failed to fetch user data");
            }
            const data = await response.json();
            return {
                preferredName: data.preferred_name || '',
                emailAddress: data.email_address || '',
                favoriteKeywords: data.favorite_keywords || [],
                favoritesOnly: data.favorites_only || false,
            };
        };
        const updateUserData = (data) => {
            if (data) {
                setFormData(data);
            }
            setLoading(false);
        };

        const fetchData = async () => {
            setLoading(true);
            const userData = await fetchUserData(id);
            updateUserData(userData);
        };

        fetchData().catch((error) => {
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
                [name]: value.split(',').map((item) => item.trim()),
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
            body: JSON.stringify({secret: id, user: formData}),
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
            setSubmitted(true);
        } catch (error) {
            setError(error.message);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleFormSubmission().catch((error) => {
            setError(error.message);
        });
    };


    const triggerNotificationsApi = async () => {
        const response = await fetch(`/api/trigger`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to trigger notifications');
        }

        return result;
    };

    const handleTriggerNotifications = async () => {
        try {
            const result = await triggerNotificationsApi();
            setTriggerResponse({success: true, message: result.message});
        } catch (error) {
            setTriggerResponse({success: false, message: error.message});
        }
    };

    const triggerNotifications = () => {
        handleTriggerNotifications().catch((error) => {
            setTriggerResponse({success: false, message: error.message});
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
                <p>Form submitted successfully!</p>
            </div>
        );
    }

    if (error === "Failed to fetch data") {
        return (
            <div className={"user-profile-form-container"}>
                <p>This login token is expired or doesn't exist</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={"user-profile-form-container"}>
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <div className={"user-profile-form-container"}>
            <h2>Edit your profile</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="preferred_name">Preferred Name:</label>
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
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="favorite_keywords">Favorite Keywords (comma-separated):</label>
                    <input
                        type="text"
                        id="favorite_keywords"
                        name="favorite_keywords"
                        value={formData.favorite_keywords.join(', ')}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group checkbox-group">
                    <label htmlFor="favorites_only">Favorites Only:</label>
                    <input
                        type="checkbox"
                        id="favorites_only"
                        name="favorites_only"
                        checked={formData.favorites_only}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group checkbox-group">
                    <label htmlFor="unsubscribe">Unsubscribe?</label>
                    <input
                        type="checkbox"
                        id="unsubscribe"
                        name="unsubscribe"
                        checked={formData.unsubscribe}
                        onChange={handleChange}
                    />
                </div>
                <button type="submit">Save</button>
                <a href="https://www.buymeacoffee.com/m.tanner" target="_blank" rel="noopener noreferrer"
                   className="coffee-button">
                    <img src="https://cdn-icons-png.flaticon.com/512/1046/1046754.png" alt="Coffee Icon"/>
                    Buy Me a Coffee
                </a>
                <a href="https://github.com/m-tanner/hawthornestereo-news/issues" target="_blank"
                   rel="noopener noreferrer"
                   className="github-button">
                    <img src="https://cdn-icons-png.flaticon.com/512/733/733553.png" alt="GitHub Icon"/>
                    Submit Issues & Feature Requests
                </a>
                {error && <p>Error: {error}</p>}
            </form>
            {/* Conditionally render the "Trigger Notifications" button */}
            {(formData.email_address.endsWith('@hawthornestereo.com') || formData.email_address.endsWith('@tanner-wei.com')) && (
                <div>
                    <button onClick={triggerNotifications}>Trigger Notifications</button>
                    {/* Show trigger response */}
                    {triggerResponse && (
                        <p>
                            {triggerResponse.success ? (
                                <span>Success: {triggerResponse.message}</span>
                            ) : (
                                <span>Error: {triggerResponse.message}</span>
                            )}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserProfileForm;
