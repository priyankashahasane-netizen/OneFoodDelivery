import 'package:flutter/material.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';

class RegistrationProgressWidget extends StatelessWidget {
  final int currentStep;
  const RegistrationProgressWidget({super.key, required this.currentStep});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
      child: Row(
        children: List.generate(8, (index) {
          int step = index + 1;
          bool isCompleted = step < currentStep;
          bool isCurrent = step == currentStep;
          
          return Expanded(
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    height: 4,
                    decoration: BoxDecoration(
                      color: isCompleted || isCurrent
                          ? Theme.of(context).primaryColor
                          : Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                if (index < 7)
                  Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isCompleted || isCurrent
                          ? Theme.of(context).primaryColor
                          : Colors.grey[300],
                    ),
                    child: Center(
                      child: isCompleted
                          ? Icon(Icons.check, size: 12, color: Colors.white)
                          : Text(
                              '$step',
                              style: robotoRegular.copyWith(
                                fontSize: 10,
                                color: Colors.white,
                              ),
                            ),
                    ),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }
}

