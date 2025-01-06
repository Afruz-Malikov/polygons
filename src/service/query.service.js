const combinedData = [
  { id: 1, position: "[33.59874969754743,-7.589492797851563]", property_type: "Apartment", rooms_number: 5 },
  { id: 2, position: "[33.604897725023875,-7.6267433166503915]", property_type: "Apartment", rooms_number: 2 },
  { id: 3, position: "[33.586738332940186,-7.670173645019532]", property_type: "Apartment", rooms_number: 3 },
  { id: 4, position: "[33.55913445780554,-7.65850067138672]", property_type: "Apartment", rooms_number: 5 },
  { id: 5, position: "[33.55083726804954,-7.594127655029298]", property_type: "Apartment", rooms_number: 5 },
  { id: 6, position: "[33.57973093125613,-7.554302215576173]", property_type: "Apartment", rooms_number: 3 },
  { id: 7, position: "[33.59874969754743,-7.589492797851563]", property_type: "Apartment", rooms_number: 1 },
  { id: 8, position: "[33.554842907431166,-7.671546936035157]", property_type: "Apartment", rooms_number: 3 },
  { id: 9, position: "[33.54253928139885,-7.602367401123048]", property_type: "Apartment", rooms_number: 5 },
  { id: 10, position: "[33.52222015776447,-7.654037475585938]", property_type: "Apartment", rooms_number: 3 },
  { id: 11, position: "[33.52164771893553,-7.68545150756836]", property_type: "Apartment", rooms_number: 1 },
  { id: 12, position: "[33.604897725023875,-7.648372650146485]", property_type: "Apartment", rooms_number: 4 },
  { id: 13, position: "[33.604897725023875,-7.648372650146485]", property_type: "Apartment", rooms_number: 65 },
  { id: 14, position: "[33.60289608978426,-7.594299316406251]", property_type: "Apartment", rooms_number: 33 },
  { id: 15, position: "[33.58902634085777,-7.61627197265625]", property_type: "Apartment", rooms_number: 23 },
  { id: 16, position: "[33.592458238962855,-7.634296417236329]", property_type: "Apartment", rooms_number: 35 },
  { id: 17, position: "[33.5963189611327,-7.644939422607423]", property_type: "Apartment", rooms_number: 34 },
];
export const fetchUsers = async (path) => {
  const response = await fetch(`https://advertesements.vercel.app/${path}`);
  if (!response.ok) {
    console.log("Network response was not ok");
  }
  return { innerData: combinedData };
};
