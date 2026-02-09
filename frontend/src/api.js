import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

export const getUsers = () => api.get('/users/').then(res => res.data);
export const createUser = (name) => api.post('/users/', { name }).then(res => res.data);

export const getProducts = () => api.get('/products/').then(res => res.data);
export const createProduct = (product) => api.post('/products/', product).then(res => res.data);
export const updateProduct = (id, product) => api.put(`/products/${id}`, product).then(res => res.data);

export const getDishes = () => api.get('/dishes/').then(res => res.data);
export const createDish = (dish) => api.post('/dishes/', dish).then(res => res.data);
export const updateDish = (id, dish) => api.put(`/dishes/${id}`, dish).then(res => res.data);

export const getLogs = (date, userId) => api.get(`/logs/${date}`, { params: { user_id: userId } }).then(res => res.data);
export const createLogEntry = (entry) => api.post('/logs/', entry).then(res => res.data);
export const deleteLogEntry = (id) => api.delete(`/logs/${id}`).then(res => res.data);

export default api;
