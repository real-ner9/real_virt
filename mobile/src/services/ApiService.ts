import axios from 'axios';
import {Observable, from, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {RoomData} from '../models/RoomData.model';

const BASE_URL = 'http://localhost:3000';

const ApiService = {
  getRoomData(roomNumber: string): Observable<RoomData> {
    return from(
      axios
        .get<RoomData>(`${BASE_URL}/rooms/${roomNumber}`)
        .then(data => data.data),
    ).pipe(
      catchError(error => {
        console.error('Error fetching room data:', error);
        return throwError(error);
      }),
    );
  },

  connectToRoom(roomNumber: string): Observable<RoomData> {
    return from(
      axios.get(`${BASE_URL}/rooms/${roomNumber}`).then(data => data.data),
    ).pipe(
      catchError(error => {
        console.error('Error connecting to room:', error);
        return throwError(error);
      }),
    );
  },

  createRoom(): Observable<RoomData> {
    return from(
      axios.post<RoomData>(`${BASE_URL}/rooms`).then(response => response.data),
    ).pipe(
      catchError(error => {
        console.error('Error creating room:', error);
        return throwError(error);
      }),
    );
  },

  searchForChat(
    userId: string,
    userParameters: any,
    searchParameters: any,
  ): Observable<string | null> {
    return from(
      axios
        .post(`${BASE_URL}/rooms/search`, {
          userId,
          userParameters,
          searchParameters,
        })
        .then(response => response.data),
    ).pipe(
      catchError(error => {
        console.error('Error searching for chat:', error);
        return throwError(error);
      }),
    );
  },

  stopSearch(userId: string): Observable<any> {
    return from(axios.post(`${BASE_URL}/rooms/stopSearch`, {userId})).pipe(
      catchError(error => {
        console.error('Error stopping search:', error);
        return throwError(error);
      }),
    );
  },

  uploadFile(fileUri: string, type: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type,
      name: fileUri.split('/').pop(),
    });

    return from(
      axios
        .post(`${BASE_URL}/rooms/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then(response => response.data),
    ).pipe(
      catchError(error => {
        console.error('Error uploading file:', error);
        return throwError(error);
      }),
    );
  },
};

export default ApiService;
