import mongoose from "mongoose";

const selectedSchema = new mongoose.Schema({
    // other fields
    selectedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SelectedUser'
    }]
  });
  
  const SelectedUser = new mongoose.model('SelectedUser', selectedSchema);

  export default SelectedUser