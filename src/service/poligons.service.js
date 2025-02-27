import customFetch from '../util/fetch';

const admin_hash =
  'FRPFCEB7B42LtUFfpgaZd0I8Bkov9UzmVQVixpNn3s/5uJPr9+ZFEJy6nrXRAxL1rbYh+hBg30H7D2XLSeLh4rfeXjYCiuaQ5471kMHXhAfKJaH85rHWUlpjd0YLQpi6';
const admin_token = 'e6c2c1f2907d51061e1abf362d6d9ff2';
// export const changePolygon = async (data) => {
//   try {
//     const response = await customFetch('/data', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//       },
//       body: new URLSearchParams({
//         token: admin_token,
//         u_hash: admin_hash,
//         data: JSON.stringify({
//           map_place_polygons: [data],
//         }),
//       }),
//     });

//     const responseData = await response.json();

//     console.log('Server:', data);

//     if (responseData.status !== 'success') {
//       throw new Error(responseData.message);
//     }

//     return responseData;
//   } catch (error) {
//     console.error('Error in changePolygon:', error);
//     return { message: error.message, status: 'error' };
//   }
// };

// Создание / редактирование полигонов
export const editPoligon = async (id, name, cords, center, radius, color) => {
  try {
    const request = await customFetch(
      '/data',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token: admin_token,
          u_hash: admin_hash,
          data: JSON.stringify({
            map_place_polygons: [
              {
                id: id ? `${id}` : id,
                var: name + id,
                coordinates: [cords],
                ru: name,
                json: {
                  center: JSON.stringify(center),
                  radius: radius,
                  color: color,
                },
              },
            ],
          }),
        }),
        mode: 'cors',
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    console.log({
      token: admin_token,
      u_hash: admin_hash,
      data: {
        map_place_polygons: [
          {
            id: id ? `${id}` : id,
            var: name + id,
            coordinates: [cords],
            ru: name,
            json: {
              center: JSON.stringify(center),
              radius: radius,
            },
          },
        ],
      },
    });
    const response = await request.json();
    return response;
  } catch (error) {
    console.log('Error in editPoligon:', error);
    return error;
  }
};

// Создание / редактирование полигонов
export const deletePolygon = async (id) => {
  try {
    const request = await customFetch('/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: admin_token,
        u_hash: admin_hash,
        data: JSON.stringify({
          map_place_polygons: [
            {
              id: id,
              ':del': 1,
            },
          ],
        }),
      }),
    });
    const response = await request.json();
    return response;
  } catch (error) {
    console.log('Error in editPoligon:', error);
    return error;
  }
};
