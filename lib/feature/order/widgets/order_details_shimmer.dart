import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:shimmer_animation/shimmer_animation.dart';

class OrderDetailsShimmer extends StatelessWidget {
  const OrderDetailsShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SingleChildScrollView(
      child: Container(
        padding: const EdgeInsets.all(16),

        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Order Header
            _buildShimmerItem(height: 20, widthPercent: 0.6),
            const SizedBox(height: 8),
            _buildShimmerItem(height: 16, widthPercent: 0.4),
            const SizedBox(height: 16),

            // Customer Info
            _buildShimmerItem(height: 16, widthPercent: 0.5),
            const SizedBox(height: 6),
            _buildShimmerItem(height: 14, widthPercent: 0.7),
            const SizedBox(height: 6),
            _buildShimmerItem(height: 14, widthPercent: 0.6),
            const SizedBox(height: 20),

            // Order Items Section Title
            _buildShimmerItem(height: 18, widthPercent: 0.3),
            const SizedBox(height: 12),

            // Repeating items
            for (int i = 0; i < 3; i++) ...[
              Row(
                children: [
                  Shimmer(
                    child: Container(
                      height: 80,
                      width: 80,
                      decoration: BoxDecoration(
                        color: theme.shadowColor,
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildShimmerItem(height: 16, widthPercent: 0.5),
                      const SizedBox(height: 6),
                      _buildShimmerItem(height: 14, widthPercent: 0.4),
                      const SizedBox(height: 6),
                      _buildShimmerItem(height: 14, widthPercent: 0.3),
                    ],
                  )
                ],
              ),
              const SizedBox(height: 16),
            ],

            // Divider
            Shimmer(
              child: Container(
                height: 1,
                width: double.infinity,
                color: theme.shadowColor,
              ),
            ),
            const SizedBox(height: 16),

            // Summary
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildShimmerItem(height: 16, widthPercent: 0.3),
                _buildShimmerItem(height: 16, widthPercent: 0.25),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildShimmerItem(height: 16, widthPercent: 0.3),
                _buildShimmerItem(height: 16, widthPercent: 0.25),
              ],
            ),
            const SizedBox(height: 20),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildShimmerItem(height: 16, widthPercent: 0.3),
                _buildShimmerItem(height: 16, widthPercent: 0.25),
              ],
            ),
            const SizedBox(height: 20),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildShimmerItem(height: 16, widthPercent: 0.3),
                _buildShimmerItem(height: 16, widthPercent: 0.25),
              ],
            ),
            const SizedBox(height: 50),

            // Action Button
            Align(
              alignment: Alignment.center,
              child: Shimmer(
                child: Container(
                  height: 40,
                  width: MediaQuery.of(Get.context!).size.width * 0.7,
                  decoration: BoxDecoration(
                    color: theme.shadowColor,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShimmerItem({required double height, required double widthPercent}) {
    return Shimmer(
      child: Container(
        height: height,
        width: MediaQuery.of(Get.context!).size.width * widthPercent,
        decoration: BoxDecoration(
          color: Theme.of(Get.context!).shadowColor,
          borderRadius: BorderRadius.circular(4),
        ),
      ),
    );
  }
}