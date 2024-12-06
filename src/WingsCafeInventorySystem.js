import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { setDoc, doc, getDocs, collection } from 'firebase/firestore';

let currentUserId = 1; 

const WingsCafeInventorySystem = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false); 
  const [currentSection, setCurrentSection] = useState('login'); 
  const [users, setUsers] = useState([]); 

  const handleLogin = async () => {
    setIsLoggedIn(true);
    setCurrentSection('dashboard');
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      setIsLoggedIn(false);
      setCurrentSection('login');
    });
  };

  const saveUserData = async (user) => {
    try {
      if (user) {
        const userId = currentUserId++;  // Ensure that this gets incremented for every new user
        await setDoc(doc(db, 'users', userId.toString()), {
          email: user.email,
          userId: userId,
        });
      }
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const userList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        userList.push({
          email: data.email,
          userId: data.userId,
        });
      });
      setUsers(userList);  // Update the users state with fetched users
      console.log('Users fetched:', userList);  // Log the fetched users
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        setCurrentSection('dashboard');
        saveUserData(user);  // Save user data when logged in
        fetchUsers();  // Fetch users from Firestore when logged in
      } else {
        setIsLoggedIn(false);
        setCurrentSection('login');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="container">
      <h1>WINGS CAFE INVENTORY SYSTEM</h1>
      {isLoggedIn ? (
        <Dashboard
          onLogout={handleLogout}
          setCurrentSection={setCurrentSection}
          currentSection={currentSection}
          users={users}
        />
      ) : (
        <div className="auth-section">
          <h2>{isRegistered ? 'User Login' : 'User Registration'}</h2>
          {isRegistered ? (
            <UserLogin onLogin={handleLogin} onSwitchToRegistration={() => setIsRegistered(false)} />
          ) : (
            <UserRegistration onRegister={() => setIsRegistered(true)} onSwitchToLogin={() => setIsRegistered(true)} />
          )}
        </div>
      )}
      <Footer />
    </div>
  );
};

const Dashboard = ({ onLogout, setCurrentSection, currentSection, users }) => {
  return (
    <div id="dashboard">
      <h2>Welcome to Wingscafe</h2>

      <ul id="dashboard-sections">
        <li className="dashboard-item">
          <div>
            <strong>Section:</strong> User Management
          </div>
          <button onClick={() => setCurrentSection('userManagement')}>Go to User Management</button>
        </li>

        <li className="dashboard-item">
          <div>
            <strong>Section:</strong> Product Management
          </div>
          <button onClick={() => setCurrentSection('productManagement')}>Go to Product Management</button>
        </li>

        <li className="dashboard-item">
          <div>
            <strong>Section:</strong> Logout
          </div>
          <button onClick={onLogout}>Logout</button>
        </li>
      </ul>

      <div>
        {currentSection === 'userManagement' && <UserManagement users={users} />}
        {currentSection === 'productManagement' && <ProductManagement />}
      </div>
    </div>
  );
};

const UserManagement = ({ users }) => {
  return (
    <div id="user-management">
      <h3>User Management</h3>
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <ul>
          {users.map((user, index) => (
            <li key={index}>
              <p>Email: {user.email}</p>
              <p>User ID: {user.userId}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    quantity: '',
  });
  const [editIndex, setEditIndex] = useState(null);

  const handleChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.id]: e.target.value });
  };

  const addProduct = (e) => {
    e.preventDefault();
    if (newProduct.name && newProduct.description && newProduct.category && newProduct.price && newProduct.quantity) {
      if (editIndex !== null) {
        const updatedProducts = [...products];
        updatedProducts[editIndex] = newProduct;
        setProducts(updatedProducts);
        setEditIndex(null);
      } else {
        setProducts([...products, newProduct]);
      }
      setNewProduct({
        name: '',
        description: '',
        category: '',
        price: '',
        quantity: '',
      });
    } else {
      alert('Please fill out all fields');
    }
  };

  const deleteProduct = (index) => {
    const updatedProducts = products.filter((_, productIndex) => productIndex !== index);
    setProducts(updatedProducts);
  };

  const editProduct = (index) => {
    setNewProduct(products[index]);
    setEditIndex(index);
  };

  const sellProduct = (index) => {
    const updatedProducts = [...products];
    if (updatedProducts[index].quantity > 0) {
      updatedProducts[index].quantity -= 1;
      setProducts(updatedProducts);
    } else {
      alert('Insufficient stock to sell this product');
    }
  };

  return (
    <div id="product-management">
      <div>
        <h2>Product Management</h2>
        <form onSubmit={addProduct}>
          <input type="text" id="name" placeholder="Product Name" value={newProduct.name} onChange={handleChange} />
          <input type="text" id="description" placeholder="Description" value={newProduct.description} onChange={handleChange} />
          <input type="text" id="category" placeholder="Category" value={newProduct.category} onChange={handleChange} />
          <input type="number" id="price" placeholder="Price" value={newProduct.price} onChange={handleChange} />
          <input type="number" id="quantity" placeholder="Quantity" value={newProduct.quantity} onChange={handleChange} />
          <button type="submit">{editIndex !== null ? 'Update Product' : 'Add Product'}</button>
        </form>
      </div>

      <div>
        <h3>Product List</h3>
        <ProductList
          products={products}
          deleteProduct={deleteProduct}
          editProduct={editProduct}
          sellProduct={sellProduct}
        />
      </div>
    </div>
  );
};

const ProductList = ({ products, deleteProduct, editProduct, sellProduct }) => (
  <div>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Category</th>
          <th>Price</th>
          <th>Quantity</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {products.length > 0 ? (
          products.map((product, index) => (
            <tr key={index}>
              <td>{product.name}</td>
              <td>{product.description}</td>
              <td>{product.category}</td>
              <td>M{product.price}</td>
              <td>{product.quantity}</td>
              <td>
                <button onClick={() => editProduct(index)}>Edit</button>
                <button onClick={() => deleteProduct(index)}>Delete</button>
                <button onClick={() => sellProduct(index)}>Sell</button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6">No products found</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const UserLogin = ({ onLogin, onSwitchToRegistration }) => (
  <div>
    <input type="email" placeholder="Email" />
    <input type="password" placeholder="Password" />
    <button onClick={onLogin}>Login</button>
    <p>Don't have an account? <button onClick={onSwitchToRegistration}>Register</button></p>
  </div>
);

const UserRegistration = ({ onRegister, onSwitchToLogin }) => (
  <div>
    <input type="email" placeholder="Email" />
    <input type="password" placeholder="Password" />
    <button onClick={onRegister}>Register</button>
    <p>Already have an account? <button onClick={onSwitchToLogin}>Login</button></p>
  </div>
);

const Footer = () => (
  <footer className="footer">
    <div className="footer-content">
      <div className="footer-section">
        <h4>Wings Cafe</h4>
        <p>Efficient Inventory Management at Your Fingertips</p>
      </div>
      <div className="footer-section">
        <h4>Quick Links</h4>
        <ul>
          <li><a href="/privacy-policy">Privacy Policy</a></li>
          <li><a href="/terms-of-service">Terms of Service</a></li>
          <li><a href="/contact">Contact +266 59544053</a></li>
        </ul>
      </div>
      <div className="footer-section">
        <h4>Follow Us</h4>
        <div className="social-media">
          <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
          <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
          <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </div>
      </div>
    </div>
    <div className="footer-bottom">
      <p>© 2024 Wings Cafe Inventory System. All rights reserved.</p>
    </div>
  </footer>
);

export default WingsCafeInventorySystem;
