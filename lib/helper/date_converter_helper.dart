import 'package:stackfood_multivendor_driver/feature/splash/controllers/splash_controller.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

class DateConverter {
  static String formatDate(DateTime dateTime) {
    return DateFormat('yyyy-MM-dd hh:mm:ss').format(dateTime);
  }

  static String estimatedDate(DateTime dateTime) {
    return DateFormat('dd MMM yyyy').format(dateTime);
  }

  static String estimatedOnlyDate(DateTime dateTime) {
    return DateFormat('dd-MM-yyyy').format(dateTime);
  }

  static String dateTimeStringToDateTime(String dateTime) {
    return DateFormat('dd MMM yyyy  ${_timeFormatter()}').format(DateFormat('yyyy-MM-dd HH:mm:ss').parse(dateTime));
  }

  static String dateTimeStringToTime(String dateTime) {
    return DateFormat(_timeFormatter()).format(DateFormat('yyyy-MM-dd HH:mm:ss').parse(dateTime));
  }

  static String dateTimeStringToDateOnly(String dateTime) {
    return DateFormat('dd MMM yyyy').format(DateFormat('yyyy-MM-dd HH:mm:ss').parse(dateTime));
  }

  static DateTime dateTimeStringToDate(String dateTime) {
    return DateFormat('yyyy-MM-dd HH:mm:ss').parse(dateTime);
  }

  static DateTime convertStringToDatetime(String dateTime) {
    return DateFormat("yyyy-MM-ddTHH:mm:ss.SSS").parse(dateTime);
  }

  static DateTime isoStringToLocalDate(String dateTime) {
    return DateFormat('yyyy-MM-ddTHH:mm:ss.SSS').parse(dateTime);
  }

  static String isoStringToLocalTimeOnly(String dateTime) {
    return DateFormat(_timeFormatter()).format(isoStringToLocalDate(dateTime));
  }

  static String isoStringToLocalDateOnly(String dateTime) {
    return DateFormat('dd MMM yyyy').format(isoStringToLocalDate(dateTime));
  }

  static String isoStringToLocalAMPM(String dateTime) {
    return DateFormat('a').format(isoStringToLocalDate(dateTime));
  }

  static String onlyTimeShow(String time) {
    return DateFormat(_timeFormatter()).format(DateFormat('HH:mm:ss').parse(time));
  }

  static String isoStringToLocalDateAnTime(String dateTime) {
    return DateFormat('dd/MMM/yyyy ${_timeFormatter()}').format(isoStringToLocalDate(dateTime));
  }

  static String localDateToIsoString(DateTime dateTime) {
    return DateFormat('yyyy-MM-ddTHH:mm:ss.SSS').format(dateTime);
  }

  static String convertTimeToTime(String time) {
    return DateFormat(_timeFormatter()).format(DateFormat('hh:mm:ss').parse(time));
  }

  static int timeDistanceInMin(String time) {
    DateTime currentTime = DateTime.now();
    DateTime rangeTime = dateTimeStringToDate(time);
    return currentTime.difference(rangeTime).inMinutes;
  }

  static String _timeFormatter() {
    return Get.find<SplashController>().configModel!.timeformat == '24' ? 'HH:mm' : 'hh:mm a';
  }

  static int differenceInMinute(String? deliveryTime, String? orderTime, int? processingTime, String? scheduleAt) {
    // 'min', 'hours', 'days'
    int minTime = processingTime ?? 0;
    if(deliveryTime != null && deliveryTime.isNotEmpty && processingTime == null) {
      try {
        List<String> timeList = deliveryTime.split('-'); // ['15', '20']
        minTime = int.parse(timeList[0]);
      }catch(_) {}
    }
    DateTime deliveryTime0 = dateTimeStringToDate(scheduleAt ?? orderTime!).add(Duration(minutes: minTime));
    return deliveryTime0.difference(DateTime.now()).inMinutes;
  }

  static bool isBeforeTime(String? dateTime) {
    if(dateTime == null) {
      return false;
    }
    DateTime scheduleTime = dateTimeStringToDate(dateTime);
    return scheduleTime.isBefore(DateTime.now());
  }

  static String localDateToIsoStringAMPM(DateTime dateTime) {
    return DateFormat('${_timeFormatter()} | d-MMM-yyyy ').format(dateTime.toLocal());
  }

  static String dateTimeStringForDisbursement(String time) {
    var newTime = '${time.substring(0,10)} ${time.substring(11,23)}';
    return DateFormat('dd MMM, yyyy').format(DateFormat('yyyy-MM-dd HH:mm:ss').parse(newTime));

    // return DateFormat('${_timeFormatter()} | d-MMM-yyyy ').format(dateTime.toLocal());
  }

  static String dateTimeForCoupon(DateTime dateTime) {
    return DateFormat('yyyy-MM-dd').format(dateTime);
  }

  static String localDateToIsoStringAM(DateTime dateTime) {
    return DateFormat('dd MMM, yyyy,${_timeFormatter()}').format(dateTime.toLocal());
  }

  static DateTime isoUtcStringToLocalTimeOnly(String dateTime) {
    return DateFormat('yyyy-MM-ddTHH:mm:ss.SSS').parse(dateTime, true).toLocal();
  }

  static String isoStringToLocalDateAndTime(String dateTime) {
    return DateFormat('dd MMM yyyy \'at\' ${_timeFormatter()}').format(isoUtcStringToLocalTimeOnly(dateTime));
  }

  static int countDays(DateTime ? dateTime) {
    final startDate = dateTime!;
    final endDate = DateTime.now();
    final difference = endDate.difference(startDate).inDays;
    return difference;
  }

  static String convert24HourTimeTo12HourTimeWithDay(DateTime time, bool isToday) {
    if(isToday){
      return DateFormat('\'Today at\' ${_timeFormatter()}').format(time);
    }else{
      return DateFormat('\'Yesterday at\' ${_timeFormatter()}').format(time);
    }
  }

  static String convertStringTimeToDateTime (DateTime time){
    return DateFormat('EEE \'at\' ${_timeFormatter()}').format(time.toLocal());
  }

  static String convertDateTimeToDate(DateTime time) {
    return DateFormat(_timeFormatter()).format(time);
  }

  static String convertTodayYesterdayDate(String createdAt) {
    final DateTime createdDate = DateFormat('yyyy-MM-dd HH:mm:ss').parse(createdAt);
    final DateTime now = DateTime.now();
    final DateFormat formatter = DateFormat('dd MMM yyyy');

    if (createdDate.year == now.year && createdDate.month == now.month && createdDate.day == now.day) {
      return 'Today';
    }

    final DateTime yesterday = now.subtract(const Duration(days: 1));
    if (createdDate.year == yesterday.year && createdDate.month == yesterday.month && createdDate.day == yesterday.day) {
      return 'Yesterday';
    }

    return formatter.format(createdDate);
  }

  static String convertTimeDifferenceInMinutes(String createdAt) {
    final DateTime createdDate = DateFormat('yyyy-MM-dd HH:mm:ss').parse(createdAt);
    final DateTime now = DateTime.now();

    if (createdDate.year == now.year && createdDate.month == now.month && createdDate.day == now.day) {
      int differenceInMinutes = now.difference(createdDate).inMinutes;
      return '$differenceInMinutes ${'min_ago'.tr}';
    } else {
      return DateFormat('h:mm a').format(createdDate);
    }
  }

  static String getTimeDifference(String createdAt) {
    final createdAtDate = DateTime.parse(createdAt);
    final now = DateTime.now();
    final difference = now.difference(createdAtDate);

    if (difference.inDays >= 365) {
      final years = (difference.inDays / 365).floor();
      return '$years ${'years_ago'.tr}';
    } else if (difference.inDays >= 30) {
      final months = (difference.inDays / 30).floor();
      return '$months ${'months_ago'.tr}';
    } else if (difference.inDays >= 7) {
      final weeks = (difference.inDays / 7).floor();
      return '$weeks ${'weeks_ago'.tr}';
    } else if (difference.inDays >= 1) {
      return '${difference.inDays} ${'days_ago'.tr}';
    } else if (difference.inHours >= 1) {
      return '${difference.inHours} ${'hours_ago'.tr}';
    } else if (difference.inMinutes >= 1) {
      return '${difference.inMinutes} ${'mins_ago'.tr}';
    } else {
      return 'just_now'.tr;
    }
  }

}
