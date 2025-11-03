class ProfileModel {
  int? id;
  String? fName;
  String? lName;
  String? phone;
  String? email;
  String? identityNumber;
  String? identityType;
  String? identityImage;
  String? imageFullUrl;
  String? fcmToken;
  int? zoneId;
  int? active;
  double? avgRating;
  int? ratingCount;
  int? memberSinceDays;
  int? orderCount;
  int? todaysOrderCount;
  int? thisWeekOrderCount;
  double? cashInHands;
  int? earnings;
  String? type;
  double? balance;
  double? todaysEarning;
  double? thisWeekEarning;
  double? thisMonthEarning;
  String? createdAt;
  String? updatedAt;
  double? totalIncentiveEarning;
  String? shiftName;
  String? shiftStartTime;
  String? shiftEndTime;
  List<IncentiveList>? incentiveList;
  double? payableBalance;
  bool? adjustable;
  bool? overFlowWarning;
  bool? overFlowBlockWarning;
  double? withDrawableBalance;
  double? totalWithdrawn;
  bool? showPayNowButton;

  ProfileModel({
    this.id,
    this.fName,
    this.lName,
    this.phone,
    this.email,
    this.identityNumber,
    this.identityType,
    this.identityImage,
    this.imageFullUrl,
    this.fcmToken,
    this.zoneId,
    this.active,
    this.avgRating,
    this.memberSinceDays,
    this.orderCount,
    this.todaysOrderCount,
    this.thisWeekOrderCount,
    this.cashInHands,
    this.ratingCount,
    this.createdAt,
    this.updatedAt,
    this.earnings,
    this.type,
    this.balance,
    this.todaysEarning,
    this.thisWeekEarning,
    this.thisMonthEarning,
    this.totalIncentiveEarning,
    this.shiftName,
    this.shiftStartTime,
    this.shiftEndTime,
    this.incentiveList,
    this.payableBalance,
    this.adjustable,
    this.overFlowWarning,
    this.overFlowBlockWarning,
    this.withDrawableBalance,
    this.totalWithdrawn,
    this.showPayNowButton,
  });

  ProfileModel.fromJson(Map<String, dynamic> json) {
    // Ensure id is never null
    id = json['id'] ?? 1;
    
    // Handle both old format (f_name, l_name) and new format (name)
    if (json['f_name'] != null) {
      fName = json['f_name'] ?? '';
      lName = json['l_name'] ?? '';
    } else if (json['name'] != null) {
      // Split name into first and last name
      List<String> nameParts = (json['name'] as String).split(' ');
      fName = nameParts.isNotEmpty ? nameParts.first : (json['name'] ?? 'Demo');
      lName = nameParts.length > 1 ? nameParts.sublist(1).join(' ') : '';
    } else {
      fName = 'Demo';
      lName = 'Driver';
    }
    
    // Ensure all string fields have defaults
    phone = json['phone'] ?? '';
    email = json['email'] ?? '';
    identityNumber = json['identity_number'] ?? '';
    identityType = json['identity_type'] ?? '';
    identityImage = json['identity_image'] ?? '';
    imageFullUrl = json['image_full_url'] ?? '';
    fcmToken = json['fcm_token'] ?? '';
    
    // Convert zone_id from string/int to int, with default
    if (json['zone_id'] != null) {
      zoneId = json['zone_id'] is int ? json['zone_id'] : int.tryParse(json['zone_id'].toString()) ?? 1;
    } else {
      zoneId = 1;
    }
    
    // Handle both old format (active) and new format (online)
    if (json['active'] != null) {
      active = json['active'] is bool ? (json['active'] ? 1 : 0) : (json['active'] is int ? json['active'] : (json['active'] == 1 ? 1 : 0));
    } else if (json['online'] != null) {
      active = json['online'] is bool ? (json['online'] ? 1 : 0) : (json['online'] == true || json['online'] == 1 ? 1 : 0);
    } else {
      active = 0;
    }
    
    // Ensure numeric fields have defaults
    avgRating = json['avg_rating'] != null ? (json['avg_rating'] is double ? json['avg_rating'] : (json['avg_rating'] as num?)?.toDouble() ?? 4.8) : 4.8;
    ratingCount = json['rating_count'] ?? 125;
    memberSinceDays = json['member_since_days'] ?? 0;
    orderCount = json['order_count'] ?? 0;
    todaysOrderCount = json['todays_order_count'] ?? 0;
    thisWeekOrderCount = json['this_week_order_count'] ?? 0;
    cashInHands = json['cash_in_hands']?.toDouble() ?? 0.0;
    earnings = json['earning'] ?? json['earnings'] ?? 0;
    type = json['type'] ?? '';
    balance = json['balance']?.toDouble() ?? 0.0;
    todaysEarning = json['todays_earning']?.toDouble() ?? 0.0;
    thisWeekEarning = json['this_week_earning']?.toDouble() ?? 0.0;
    thisMonthEarning = json['this_month_earning']?.toDouble() ?? 0.0;
    
    // Ensure date fields are strings, not null
    createdAt = json['created_at']?.toString() ?? '';
    updatedAt = json['updated_at']?.toString() ?? '';
    
    totalIncentiveEarning = json['total_incentive_earning']?.toDouble() ?? 0.0;
    shiftName = json['shift_name'] ?? '';
    shiftStartTime = json['shift_start_time'] ?? '';
    shiftEndTime = json['shift_end_time'] ?? '';
    // Ensure incentive_list is never null
    if (json['incentive_list'] != null && json['incentive_list'] is List) {
      incentiveList = <IncentiveList>[];
      (json['incentive_list'] as List).forEach((v) {
        incentiveList!.add(IncentiveList.fromJson(v));
      });
    } else {
      incentiveList = <IncentiveList>[];
    }
    payableBalance = json['Payable_Balance']?.toDouble() ?? 0.0;
    adjustable = json['adjust_able'] ?? false;
    overFlowWarning = json['over_flow_warning'] ?? false;
    overFlowBlockWarning = json['over_flow_block_warning'] ?? false;
    withDrawableBalance = json['withdraw_able_balance']?.toDouble() ?? 0.0;
    totalWithdrawn = json['total_withdrawn']?.toDouble() ?? 0.0;
    showPayNowButton = json['show_pay_now_button'] ?? false;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['f_name'] = fName;
    data['l_name'] = lName;
    data['phone'] = phone;
    data['email'] = email;
    data['identity_number'] = identityNumber;
    data['identity_type'] = identityType;
    data['identity_image'] = identityImage;
    data['image_full_url'] = imageFullUrl;
    data['fcm_token'] = fcmToken;
    data['zone_id'] = zoneId;
    data['active'] = active;
    data['avg_rating'] = avgRating;
    data['rating_count'] = ratingCount;
    data['member_since_days'] = memberSinceDays;
    data['order_count'] = orderCount;
    data['todays_order_count'] = todaysOrderCount;
    data['this_week_order_count'] = thisWeekOrderCount;
    data['cash_in_hands'] = cashInHands;
    data['earning'] = earnings;
    data['balance'] = balance;
    data['type'] = type;
    data['todays_earning'] = todaysEarning;
    data['this_week_earning'] = thisWeekEarning;
    data['this_month_earning'] = thisMonthEarning;
    data['created_at'] = createdAt;
    data['updated_at'] = updatedAt;
    data['total_incentive_earning'] = totalIncentiveEarning;
    data['shift_name'] = shiftName;
    if (incentiveList != null) {
      data['incentive_list'] = incentiveList!.map((v) => v.toJson()).toList();
    }
    data['Payable_Balance'] = payableBalance;
    data['adjust_able'] = adjustable;
    data['over_flow_warning'] = overFlowWarning;
    data['over_flow_block_warning'] = overFlowBlockWarning;
    data['withdraw_able_balance'] = withDrawableBalance;
    data['total_withdrawn'] = totalWithdrawn;
    data['show_pay_now_button'] = showPayNowButton;
    return data;
  }
}

class IncentiveList {
  int? id;
  int? zoneId;
  double? earning;
  double? incentive;
  String? createdAt;
  String? updatedAt;

  IncentiveList({
    this.id,
    this.zoneId,
    this.earning,
    this.incentive,
    this.createdAt,
    this.updatedAt,
  });

  IncentiveList.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    zoneId = json['zone_id'];
    earning = json['earning']?.toDouble();
    incentive = json['incentive']?.toDouble();
    createdAt = json['created_at'];
    updatedAt = json['updated_at'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['zone_id'] = zoneId;
    data['earning'] = earning;
    data['incentive'] = incentive;
    data['created_at'] = createdAt;
    data['updated_at'] = updatedAt;
    return data;
  }
}