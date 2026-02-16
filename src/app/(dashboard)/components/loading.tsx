import CircularProgress from '@mui/material/CircularProgress';
const Loading = ({ label = "Loading" }) => {
  return (
    <div className="d-flex gap-2 my-2 align-items-center">
      <CircularProgress size={16} /> {label}
    </div>
  );
};

export default Loading;
