import React from 'react';
import { useParams } from 'react-router-dom';

const CustomerDetail = () => {
  const { id } = useParams();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Детали клиента</h1>
      </div>
      <div className="page-content">
        <p>Детали клиента с ID: {id}</p>
        <p>Этот компонент будет реализован позже.</p>
      </div>
    </div>
  );
};

export default CustomerDetail;