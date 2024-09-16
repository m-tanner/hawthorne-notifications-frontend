import React, {useState} from "react";

const AuthForm = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const submitLoginForm = async (email_address) => {
        setMessage('')
        const response = await fetch(`/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({email_address: email_address }),
        });

        if (!response.ok) {
            throw new Error('Failed to submit form');
        }
        setSubmitted(true)
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await submitLoginForm(email).catch((error) => {
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
            <p>
                This <strong>Hawthorne Wish List</strong> site allows you to get email updates every time fresh used or open box gear shows up in Hawthorne Stereo's World Famous Used Room™️!
            </p>
            <p>
                <strong>Customize It!</strong> You can add specific brands or items you’re yearning for.
            </p>
            <p>
                <strong>Choose Your Own Adventure!</strong> Get all the Used Room updates with your favorites at the top, or just get notified when your favorites arrive.
            </p>
            <p>
                <strong>With A Little Help From My Friends!</strong> This was built by a customer for their own use, and they wanted to share it with everyone. If you use and like it, consider <a href="https://www.buymeacoffee.com/m.tanner" target="_blank" rel="noopener noreferrer">buying them a cup of coffee or a bag of beans</a>!
            </p>
            <p>
                <strong>It's not working!</strong> If you run into any problems or have suggestions, submit them <a href="https://github.com/m-tanner/hawthornestereo-news/issues" target="_blank" rel="noopener noreferrer">here</a>.
            </p>
            <p>
                <strong>Don’t Think Twice, It’s All Right!</strong> Unsubscribe any time you like.
            </p>
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
                {message && <p>{message}</p>}
            </form>
        </div>
    );
};

export default AuthForm;
