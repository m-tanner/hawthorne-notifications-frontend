import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import AuthForm from "./AuthForm";
import UserProfileForm from "./UserProfileForm";

// Main Application Component with Routing
const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<AuthForm/>}/>
                <Route path="/user-profile/:id" element={<UserProfileForm/>}/>
            </Routes>
        </Router>
    );
};

// Render the AuthForm component into the root element
ReactDOM.render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>,
    document.getElementById('root')
);
