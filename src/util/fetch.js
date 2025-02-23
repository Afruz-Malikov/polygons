const back_prefix = 'https://ibronevik.ru/taxi/c/gruzvill/api/v1';
export default function customFetch(path, options) {
  return fetch(back_prefix + path, options);
}
