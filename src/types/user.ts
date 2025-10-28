export interface User {
  id: string;
  id_number: string;
  firstname: string;
  middle_initial?: string;
  lastname: string;
  email: string;
  user_type: string;
  program_course: string;
  status: string;
  remaining_time: string;
  createdAt: string;
  updatedAt: string;
  profileImage?: string;
}