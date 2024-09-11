export const fetchUsers = async (path) => {
  const response = await fetch(`http://localhost:8088/${path}`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};
