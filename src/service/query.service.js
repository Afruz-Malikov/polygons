export const fetchUsers = async (path) => {
  const response = await fetch(`https://advertesements.vercel.app/${path}`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};
