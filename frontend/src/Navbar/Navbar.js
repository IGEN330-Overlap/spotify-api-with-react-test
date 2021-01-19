import './Navbar.css';
import logo from './overlap large.svg'

const Navbar = (props) => {
    return (
        <nav class="navbar navbar-expand-lg fixed-top navbar-text">
            <div class="container-fluid navbar-custom">
                <a>
                    <img class="change-my-color" width="100" height="100" src= {logo} alt="logo"/> 
                </a>
                <a>My Groups</a>
                <a>About Us</a>
            </div>                       
        </nav>
    );  
}

export default Navbar;
