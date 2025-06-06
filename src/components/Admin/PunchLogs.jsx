import React, { useEffect, useState } from "react";
import { getPunchRecords } from "../../api";
import expired from "../../assets/expired.png"
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { MdClose } from "react-icons/md";
import { FaFileExcel } from "react-icons/fa";
import { BsFileEarmarkPdfFill } from "react-icons/bs";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


// Format duration from { seconds }
const formatDuration = (seconds = 0) => {
  if (typeof seconds !== "number") return "—";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs}h ${mins}m ${secs}s`;
};

const MapIcon = ({ location }) => {
  // Check if location exists and is in the expected format
  if (!location) return "—";

  // Expected format: "lat,lng" or similar
  const coords = location.split(",").map((coord) => coord.trim());

  if (coords.length !== 2) return location; // Return original if not in expected format

  const googleMapsUrl = `https://www.google.com/maps?q=${coords[0]},${coords[1]}`;

  return (
    <a
      href={googleMapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`View location (${location}) on Google Maps`}
      className="text-cyan-400 hover:text-cyan-300"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mx-auto"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </a>
  );
};

const PunchLogs = () => {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 9;
  const [filteredRecordss, setFilteredRecordss] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewImage, setViewImage] = useState(false)
  const [selectedImage, setSelectedImage] = useState("");
  const [userName, setUserName] = useState("");


  useEffect(() => {
    const storedUsername = localStorage.getItem("user_name");
    setUserName(storedUsername || "Admin");
  }, []);
  

  useEffect(() => {
    const fetchPunchRecords = async () => {
      try {
        const data = await getPunchRecords();
        console.log("Data iS", data)
        setRecords(data.data);
        // setFilteredRecordss(records);
        // Debug logging
        // console.log("Photo filenames:", data.data.map(record => record.photo_filename));
      } catch (error) {
        console.error("Error fetching punch records:", error.message);
      }
    };
  
    fetchPunchRecords();
  }, []);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setCurrentPage(1); // Reset to first page on date change
  };

  // Apply both date and search filters
  const filteredRecords = records.filter((record) => {
    // Filter by search term (customer name or username)
    const matchesSearch = 
      record.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by date if selected
    const matchesDate = selectedDate 
      ? new Date(record.punch_date).toLocaleDateString() === selectedDate.toLocaleDateString()
      : true;
    
    return matchesSearch && matchesDate;
  });

  // Pagination logic
  const indexOfLast = currentPage * recordsPerPage;
  const indexOfFirst = indexOfLast - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleExportExcel = () => {
    const exportData = filteredRecords.map((record) => ({
      Date: new Date(record.punch_date).toLocaleDateString(),
      User: record.username || "N/A",
      "Client ID": record.client_id || "N/A",
      "Customer Name": record.customer_name || "N/A",
      "Punch In Time": record.punch_in_time
        ? new Date(record.punch_in_time).toLocaleTimeString()
        : "—",
      "Punch In Location": record.punch_in_location || "—",
      "Punch Out Time": record.punch_out_time
        ? new Date(record.punch_out_time).toLocaleTimeString()
        : "Pending",
      "Punch Out Location": record.punch_out_location || "—",
      "Punch Out Date": new Date(record.punch_out_date).toLocaleDateString(),
      "Total Time": record.total_time_spent
        ? formatDuration(
            (record.total_time_spent.minutes || 0) * 60 +
              (record.total_time_spent.seconds || 0)
          )
        : "Pending",
      Photo: record.photo_url || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Punch Logs");

    XLSX.writeFile(workbook, `Punch_Logs_${userName}.xlsx`);
  };


  const handleExportPDF = () => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const head = [[
    "Date",
    "User",
    "Client ID",
    "Customer Name",
    "Punch In Time",
    "Punch In Location",
    "Punch Out Time",
    "Punch Out Location",
    "Punch Out Date",
    "Total Time",
    "Photo"
  ]];

  const body = filteredRecords.map((record) => [
    new Date(record.punch_date).toLocaleDateString(),
    record.username || "N/A",
    record.client_id || "N/A",
    record.customer_name || "N/A",
    record.punch_in_time
      ? new Date(record.punch_in_time).toLocaleTimeString()
      : "—",
    record.punch_in_location || "—",
    record.punch_out_time
      ? new Date(record.punch_out_time).toLocaleTimeString()
      : "Pending",
    record.punch_out_location || "—",
    new Date(record.punch_out_date).toLocaleDateString(),
    record.total_time_spent
      ? formatDuration(
          (record.total_time_spent.minutes || 0) * 60 +
          (record.total_time_spent.seconds || 0)
        )
      : "Pending",
    record.photo_url || "N/A"
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 20,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [34, 139, 34],
      textColor: 255,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 20 }, // Date
      1: { cellWidth: 20 }, // User
      2: { cellWidth: 18 }, // Client ID
      3: { cellWidth: 40 }, // Customer Name
      4: { cellWidth: 20 }, // Punch In Time
      5: { cellWidth: 30 }, // Punch In Location
      6: { cellWidth: 25 }, // Punch Out Time
      7: { cellWidth: 30 }, // Punch Out Location
      8: { cellWidth: 18 }, // Punch Out Date
      9: { cellWidth: 20 }, // Total Time
      10: { cellWidth: 35 }, // Photo URL
    },
    margin: { left: 10, right: 10 },
  });
  doc.save(`Punch_Logs_${userName}.pdf`);
};






  return (
    <div className="overflow-hidden">
      <div className="text-3xl text-[#fff] mb-6 font-bold text-center pt-10">
        Punch Logs
      </div>

      <div className="flex justify-between items-center px-2 gap-2">
        <div style={{ marginBottom: "1rem" }}>
          <label className="text-white mr-2">Select Date: </label>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            placeholderText="Filter by date"
            dateFormat="MM/dd/yyyy"
            isClearable
            className="p-2 rounded-md bg-gray-700 text-white border outline-none border-[#ffffff2d]"
          />
        </div>
        <div className="flex justify-center gap-5">
          <button
            onClick={handleExportPDF}
            className="flex cursor-pointer gap-1.5 items-center bg-[#fff] px-6 rounded-lg py-2 font-semibold"
          >
            Export PDF
            <span className="text-[#bd0000]">
              <BsFileEarmarkPdfFill />
            </span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex gap-1.5 cursor-pointer items-center bg-[#fff] px-6 rounded-lg py-2 font-semibold"
          >
            Export Data
            <span className="text-[#10bd00]">
              <FaFileExcel />
            </span>
          </button>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 md:grid-cols-12 gap-4 md:gap-10 items-center mb-5">
        {/* Search Input */}
        <div className="col-span-1 md:col-span-9">
          <input
            type="text"
            placeholder="Search by Customer Name or User"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="p-2 w-full rounded-md bg-gray-700 text-white border outline-none border-[#ffffff2d]"
          />
        </div>

        {/* Pagination Controls */}
        <div className="col-span-1 md:col-span-3 flex flex-col md:flex-row justify-center items-center gap-3 md:gap-4 w-full">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded w-full md:w-auto ${
              currentPage === 1
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
          >
            Previous
          </button>
          <span className="text-white text-sm text-center w-full md:w-auto">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded w-full md:w-auto ${
              currentPage === totalPages
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
          >
            Next
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl shadow-xl overflow-hidden">
        <table className="w-full table-auto border-collapse bg-gradient-to-tr from-gray-800 to-gray-900 text-xs text-white overflow-hidden">
          <thead className="text-[#ffffffb7] font-light border-b uppercase border-gray-700">
            <tr className="font-light">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Client ID</th>
              <th className="px-6 py-4">Customer Name</th>
              <th className="px-6 py-4">Punch In Time</th>
              <th className="px-6 py-4">Punch In Location</th>
              <th className="px-6 py-4">Punch Out Time</th>
              <th className="px-6 py-4">Punch Out Location</th>
              <th className="px-6 py-4">Punch Out Date</th>
              <th className="px-6 py-4">Total Time</th>
              <th className="px-6 py-4">Photo</th>
            </tr>
          </thead>
          <tbody className="whitespace-nowrap text-center">
            {currentRecords.map((record, index) => (
              <tr
                key={index}
                className="border-b border-gray-700 hover:bg-gray-800 transition"
              >
                <td className="px-6 py-4">
                  {/* {new Date(record.punch_date).toLocaleDateString()} */}
                  <li key={index} className="list-none">
                    {new Date(record.punch_date).toLocaleDateString()}
                    {record.punch_time}
                  </li>
                </td>
                <td className="px-6 py-4">{record.username || "N/A"}</td>
                <td className="px-6 py-4">{record.client_id || "N/A"}</td>
                <td className="px-6 py-4">{record.customer_name || "N/A"}</td>
                <td className="px-6 py-4">
                  {record.punch_in_time
                    ? new Date(record.punch_in_time).toLocaleTimeString()
                    : "—"}
                </td>
                <td className="px-6 py-4">
                  <MapIcon location={record.punch_in_location} />
                </td>

                <td className="px-6 py-4">
                  {record.punch_out_time
                    ? new Date(record.punch_out_time).toLocaleTimeString()
                    : "Pending"}
                </td>
                <td className="px-6 py-4">
                  <MapIcon location={record.punch_out_location} />
                </td>
                <td className="px-6 py-4">
                  {new Date(record.punch_out_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  {record.total_time_spent
                    ? formatDuration(
                        (record.total_time_spent.minutes || 0) * 60 +
                          (record.total_time_spent.seconds || 0)
                      )
                    : "Pending"}
                </td>

                <td className="px-6 py-4">
                  {record.photo_url ? (
                    <img
                      onClick={() => {
                        setSelectedImage(record.photo_url);
                        setViewImage(true);
                      }}
                      src={record.photo_url}
                      alt="Punch"
                      className="rounded-full border border-cyan-500 shadow-md w-10 h-10 object-cover cursor-pointer"
                      onError={(e) => {
                        console.error(
                          `Failed to load image: ${record.photo_filename}`
                        );
                        // Try to log the full URL that failed
                        console.error(`Full URL that failed: ${e.target.src}`);
                        e.target.src = expired;
                        e.target.onerror = null;
                      }}
                    />
                  ) : (
                    <img
                      src={expired}
                      alt=""
                      className="rounded-full border border-cyan-500 shadow-md w-10 h-10 object-cover"
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {viewImage && (
        <div className="fixed top-0 right-0 bottom-0 left-0 h-full w-full bg-[#000000c4] z-[999] flex justify-center items-center">
          <div
            className="absolute top-5 right-5 text-white text-3xl cursor-pointer"
            onClick={() => setViewImage(false)}
          >
            <MdClose />
          </div>
          <img
            src={selectedImage}
            alt="Preview"
            className="max-w-full max-h-[90%] rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  );
};

export default PunchLogs;
