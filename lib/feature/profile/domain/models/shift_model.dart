class ShiftModel {
  int? id;
  String? name;
  String? startTime;
  String? endTime;
  int? status;
  String? createdAt;
  String? updatedAt;

  ShiftModel({
    this.id,
    this.name,
    this.startTime,
    this.endTime,
    this.status,
    this.createdAt,
    this.updatedAt,
  });

  ShiftModel.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    // Handle both 'name' and 'shift_name' for backward compatibility
    name = json['name'] ?? json['shift_name'];
    // Handle both 'start_time' and 'shift_start_time' for backward compatibility
    startTime = json['start_time'] ?? json['shift_start_time'];
    // Handle both 'end_time' and 'shift_end_time' for backward compatibility
    endTime = json['end_time'] ?? json['shift_end_time'];
    status = json['status'];
    createdAt = json['created_at'];
    updatedAt = json['updated_at'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['name'] = name;
    data['start_time'] = startTime;
    data['end_time'] = endTime;
    data['status'] = status;
    data['created_at'] = createdAt;
    data['updated_at'] = updatedAt;
    return data;
  }
}