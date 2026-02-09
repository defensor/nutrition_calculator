import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { useNavigate } from 'react-router-dom';
import '../Calendar.css';
import { format } from 'date-fns';

const CalendarPage = () => {
  const navigate = useNavigate();
  const [value, setValue] = useState(new Date());

  const handleDateChange = (date) => {
    setValue(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    navigate(`/diary/${dateStr}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Select Date</h1>
      <div className="p-4 bg-white rounded-lg shadow-lg">
        <Calendar
          onChange={handleDateChange}
          value={value}
          className="mx-auto"
        />
      </div>
    </div>
  );
};

export default CalendarPage;
