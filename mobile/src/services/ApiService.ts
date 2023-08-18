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
};

export default ApiService;