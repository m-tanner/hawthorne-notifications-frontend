import React, {useState} from "react";

const frontEndURL = process.env.REACT_APP_FRONTEND_BASE_URL;

const AuthForm = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const submitLoginForm = async (email_address, url) => {
        setMessage('')
        const response = await fetch(`/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({email_address: email_address, url: url }),
        });

        if (!response.ok) {
            throw new Error('Failed to submit form');
        }
        setSubmitted(true)
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await submitLoginForm(email, `${frontEndURL}/user-profile/`).catch((error) => {
            setMessage(`Error: ${error.message}`);
            console.error('Error:', error);
        });
    };

    // Render the "check your email" message if the form has been submitted
    if (submitted) {
        return (
            <div className="auth-form-container">
                <h2>Check Your Email</h2>
                <p>
                    We've sent you an email with a link to confirm your email or sign-in.
                    Please check your inbox!
                </p>
            </div>
        );
    }

    // Render the form by default
    return (
        <div className="auth-form-container">
            <h2>Login or Sign Up</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email Address:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Submit</button>
                <a href="https://www.buymeacoffee.com/m.tanner" target="_blank" rel="noopener noreferrer"
                   className="coffee-button">
                    <img src="https://cdn-icons-png.flaticon.com/512/1046/1046754.png" alt="Coffee Icon"/>
                    Buy Me a Coffee
                </a>
                <a href="https://github.com/m-tanner/hawthornestereo-news/issues" target="_blank"
                   rel="noopener noreferrer" className="github-button">
                    <img src="https://cdn-icons-png.flaticon.com/512/733/733553.png" alt="GitHub Icon"/>
                    Report a Bug
                </a>
                {message && <p>{message}</p>}
            </form>
        </div>
    );
};

export default AuthForm;
