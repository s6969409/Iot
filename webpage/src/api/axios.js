import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
//import Cookies from 'js-cookie';
//import { setClearMaskArr, setMaskArr } from '../store/slice/maskSlice';
import { message } from "antd";
import { hasPath } from '../utils';

let store = {};
export const injectStore = (_store) => {
  store = _store;
};

const BASE_URL = `${process.env.REACT_APP_SERVER_URL || `${window.location.protocol}//${window.location.hostname}`}:${process.env.REACT_APP_SERVER_PORT || '3000'}`
const SYSTEM_NAME = process.env.REACT_APP_NAME || 'test';

// eslint-disable-next-line import/no-anonymous-default-export
export default async (propsConfig) => { 

  const { customBaseUrl = '', url = '',type = 'application/json', data, useErrMsg = true } = propsConfig;
  const loadingId = uuidv4();
  const instance = axios.create({
    baseURL: customBaseUrl === '' ? BASE_URL : customBaseUrl,
    headers: { common: {} },
  });
  const { dispatch = () => {} } = store;
  
  instance.defaults.headers['Content-Type'] = type;

  instance.interceptors.request.use(
    (config) => {
      const { withToken = true, withLoading = true } = config;
      //#region token used by cookie
      /*
      if (withToken) {
        const token = Cookies.get(`${SYSTEM_NAME}_token`);
        if (token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          };
        }
      }
      if (withLoading) {
        dispatch(
          setMaskArr({
            id: loadingId,
            url: customBaseUrl === '' ? BASE_URL : customBaseUrl,
          })
        );
      }
      */
      //#endregion
      if (type ==='multipart/form-data') {
        const formData = new FormData();
        formData.append('file', data.get('file'));
        config.data = formData;
        config.headers['Content-Type'] = 'multipart/form-data';
      }

      return config;
    },
    (error) => {
      //used by store/slice
      //dispatch(setClearMaskArr(loadingId));
      return Promise.reject(error);
    }
  );
  instance.interceptors.response.use(
    (response) => {
      //used by store/slice
      //dispatch(setClearMaskArr(loadingId));
      return response;
    },
    (e) => {
      console.log('axios e',e)
      if(useErrMsg && hasPath(e, 'response.data')){
        const { message: errorMessage } = e.response.data
        message.error(errorMessage)
      }
      //used by store/slice
      //dispatch(setClearMaskArr(loadingId));
      return Promise.reject(e);
    }
  );

  return instance(propsConfig);
};